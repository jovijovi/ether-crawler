import {BlockWithTransactions, TransactionReceipt} from '@ethersproject/abstract-provider';
import fastq, {queueAsPromised} from 'fastq';
import got from 'got';
import {auditor, log, util} from '@jovijovi/pedrojs-common';
import {network} from '@jovijovi/ether-network';
import {
	DefaultExecuteJobConcurrency,
	DefaultFromBlock,
	DefaultKeepRunning,
	DefaultLoopInterval,
	DefaultMaxBlockRange,
	DefaultPushJobIntervals,
	DefaultQueryIntervals,
	DefaultRetryTimes,
} from './params';
import {TxTypeTransfer} from './constants';
import {CompactTx, Response} from './types';
import {Options} from './options';
import {customConfig} from '../config';
import {DB} from './db';
import {CheckTxType} from './utils';
import {GetBlockNumber, RandomRetryInterval} from './common';

// Compact tx queue (ASC, FIFO)
const txQueue = new util.Queue<CompactTx>();

// Pull block jobs
const pullBlockJobs: queueAsPromised<Options> = fastq.promise(pullBlocks, 1);

// Query logs jobs
let queryTxJobs: queueAsPromised<Options>;

// Dump job
const dumpJob: queueAsPromised<util.Queue<CompactTx>> = fastq.promise(dump, 1);

// Run crawler
export async function Run() {
	const [conf, ok] = await init();
	if (!ok) {
		return;
	}

	// Schedule processing job
	setInterval(() => {
		auditor.Check(txQueue, "Tx queue is nil");
		if (txQueue.Length() === 0) {
			return;
		}

		dumpJob.push(txQueue).catch((err) => log.RequestId().error(err));
	}, DefaultLoopInterval);

	// Push PullBlock job
	PushJob({
		txType: conf.txType,
		fromBlock: conf.fromBlock,
		toBlock: conf.toBlock,
		maxBlockRange: conf.maxBlockRange ? conf.maxBlockRange : DefaultMaxBlockRange,
		pushJobIntervals: conf.pushJobIntervals ? conf.pushJobIntervals : DefaultPushJobIntervals,
		keepRunning: conf.keepRunning,
	});

	log.RequestId().info("Crawler is running...");

	return;
}

// Init crawler
async function init(): Promise<[customConfig.CrawlerConfig, boolean]> {
	// Load config
	const conf = customConfig.GetCrawler();
	if (!conf) {
		log.RequestId().info('No crawler configuration, skipped.');
		return [undefined, false];
	} else if (!conf.enable) {
		log.RequestId().info('Crawler disabled.');
		return [undefined, false];
	}

	log.RequestId().info("Crawler config=", conf);

	// Check params
	auditor.Check(conf.executeJobConcurrency >= 1, "Invalid executeJobConcurrency");
	auditor.Check(conf.fromBlock >= 0, "Invalid fromBlock");

	// Connect to database
	await DB.Connect();

	// Build query tx job
	queryTxJobs = fastq.promise(queryTx, conf.executeJobConcurrency ? conf.executeJobConcurrency : DefaultExecuteJobConcurrency);

	return [conf, true];
}

// Execute query transactions job
async function queryTx(opts: Options = {
	txType: [TxTypeTransfer],
	fromBlock: DefaultFromBlock
}): Promise<void> {
	log.RequestId().trace("EXEC JOB(%s), QueryTx(blocks[%d,%d]) running... QueryTxJobsCount=%d",
		opts.txType, opts.fromBlock, opts.toBlock, queryTxJobs.length());

	const provider = network.MyProvider.Get();

	// Get block one by one
	for (let blockNumber = opts.fromBlock; blockNumber <= opts.toBlock; blockNumber++) {
		// Get block with transactions
		const block = await util.retry.Run(async (): Promise<BlockWithTransactions> => {
			return provider.getBlockWithTransactions(blockNumber);
		}, DefaultRetryTimes, RandomRetryInterval(), false);

		// Skip empty block (no tx)
		if (block.transactions.length === 0) {
			continue;
		}

		// Query tx
		for (const tx of block.transactions) {
			// Check transaction type
			if (!CheckTxType(tx, opts.txType)) {
				continue;
			}

			// Try to tx receipt
			const receipt = await util.retry.Run(async (): Promise<TransactionReceipt> => {
				return provider.getTransactionReceipt(tx.hash);
			}, DefaultRetryTimes, RandomRetryInterval(), false);

			// Build compact tx
			const compactTx: CompactTx = {
				blockNumber: tx.blockNumber,
				blockHash: tx.blockHash,
				blockTimestamp: block.timestamp,
				txHash: tx.hash,
				from: tx.from,
				to: tx.to,
				value: tx.value,
				nonce: tx.nonce,
				status: receipt.status,
				gasLimit: tx.gasLimit,
				gasPrice: tx.gasPrice,
				gasUsed: receipt.gasUsed,
			}

			// Push compact tx to queue
			txQueue.Push(compactTx);
		}
	}

	log.RequestId().trace("JOB(%s) FINISHED, QueryTx(blocks[%d,%d]), QueryTxJobsCount=%d",
		opts.txType, opts.fromBlock, opts.toBlock, queryTxJobs.length());

	return;
}

// Generate query transaction job
async function pullBlocks(opts: Options = {
	txType: [TxTypeTransfer],
	fromBlock: DefaultFromBlock,
	maxBlockRange: DefaultMaxBlockRange,
	pushJobIntervals: DefaultPushJobIntervals,
	keepRunning: DefaultKeepRunning,
}): Promise<void> {
	let nextFrom = opts.fromBlock;
	let nextTo = 0;
	let blockRange = opts.maxBlockRange;
	let leftBlocks = 0;
	let blockNumber = opts.toBlock ? opts.toBlock : await GetBlockNumber();

	auditor.Check(blockNumber >= nextFrom, "Invalid fromBlock/toBlock");

	do {
		leftBlocks = blockNumber - nextFrom;
		if (leftBlocks <= 0) {
			if (!opts.keepRunning) {
				break;
			}
			await util.time.SleepSeconds(DefaultQueryIntervals);
			blockNumber = await GetBlockNumber();
			continue;
		}

		blockRange = leftBlocks < opts.maxBlockRange ? leftBlocks : opts.maxBlockRange;
		nextTo = nextFrom + blockRange;

		if (blockRange >= 0 && blockRange <= 1) {
			log.RequestId().debug("Catch up the latest block(%d)", blockNumber);
		}
		log.RequestId().trace("PUSH JOB, blocks[%d,%d](range=%d), queryTxJobs=%d", nextFrom, nextTo, blockRange, queryTxJobs.length());

		queryTxJobs.push({
			txType: opts.txType,    // Transaction type: transfer
			fromBlock: nextFrom,    // Fetch from block number
			toBlock: nextTo,        // Fetch to block number
		}).catch((err) => log.RequestId().error(err));

		nextFrom = nextTo + 1;

		await util.time.SleepMilliseconds(opts.pushJobIntervals);
	} while (nextFrom > 0);

	log.RequestId().info("PullBlocks finished, options=%o", opts);

	return;
}

// Dump tx callback
async function callback(tx: CompactTx): Promise<void> {
	try {
		const conf = customConfig.GetCrawler();

		// Check URL
		if (!conf.callback) {
			return;
		}

		// Callback
		log.RequestId().debug("Crawler calling back(%s)... tx:", conf.callback, tx);
		const rsp: Response = await got.post(conf.callback, {
			json: tx
		}).json();

		log.RequestId().trace("Crawler callback response=", rsp);
	} catch (e) {
		log.RequestId().error("Crawler callback failed, error=", e);
		return;
	}

	return;
}

// Dump tx
async function dump(queue: util.Queue<CompactTx>): Promise<void> {
	try {
		const conf = customConfig.GetCrawler();
		const len = queue.Length();
		if (len === 0) {
			return;
		}

		for (let i = 0; i < len; i++) {
			const tx = queue.Shift();

			// Callback (Optional)
			await callback(tx);

			// Dump tx to database
			if (!conf.forceUpdate && await DB.Client().IsTxExists(tx.txHash)) {
				log.RequestId().debug("Tx(%s) in block(%d) already exists, skipped", tx.txHash, tx.blockNumber);
				return;
			}

			log.RequestId().info("Dumping tx to db, count=%d, tx=%o", i + 1, tx);
			await DB.Client().Save(tx);
		}
	} catch (e) {
		log.RequestId().error("Dump failed, error=", e);
		return;
	}

	return;
}

// PushJob push PullBlock job to scheduler
export function PushJob(opts: Options) {
	pullBlockJobs.push({
		txType: opts.txType,
		fromBlock: opts.fromBlock,
		toBlock: opts.toBlock,
		maxBlockRange: opts.maxBlockRange ? opts.maxBlockRange : customConfig.GetCrawler().maxBlockRange,
		pushJobIntervals: opts.pushJobIntervals ? opts.pushJobIntervals : customConfig.GetCrawler().pushJobIntervals,
		keepRunning: opts.keepRunning,
	}).catch((err) => log.RequestId().error(err));
}
