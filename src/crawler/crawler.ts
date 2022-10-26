import {BlockWithTransactions, TransactionReceipt} from '@ethersproject/abstract-provider';
import fastq, {queueAsPromised} from 'fastq';
import {auditor, log, util} from '@jovijovi/pedrojs-common';
import {network} from '@jovijovi/ether-network';
import {
	DefaultExecuteJobConcurrency,
	DefaultFromBlock,
	DefaultKeepRunning,
	DefaultMaxBlockRange,
	DefaultPushJobIntervals,
	DefaultQueryIntervals,
	DefaultRetryTimes,
} from './params';
import {TxTypeTransfer} from './constants';
import {CompactTx} from './types';
import {Options} from './options';
import {customConfig} from '../config';
import {DB} from './db';
import {CheckTxType, NewJobID} from './utils';
import {GetBlockNumber, RandomRetryInterval} from './common';
import {NewProgressBar, UpdateProgressBar} from './progress';
import * as callback from './callback';
import * as dump from './dump';

// Pull block jobs
const pullBlockJobs: queueAsPromised<Options> = fastq.promise(pullBlocks, 1);

// Query logs jobs
let queryTxJobs: queueAsPromised<Options>;

// Run crawler
export async function Run() {
	const [conf, ok] = await init();
	if (!ok) {
		return;
	}

	// Schedule dump job
	await dump.Run();

	// Schedule callback job
	if (conf.callback) {
		await callback.Run();
	}

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
	log.RequestId().trace("EXEC JOB(QueryTx|id:%s|type:%s), blocks[%d,%d], TotalJobs=%d",
		opts.jobId, opts.txType, opts.fromBlock, opts.toBlock, queryTxJobs.length());

	const conf = customConfig.GetCrawler();

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
				blockDatetime: util.time.GetUnixTimestamp(block.timestamp, 'UTC'),
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

			// Push compactTx to dump queue
			dump.Push(compactTx);

			// Push compactTx to callback queue
			if (conf.callback) {
				callback.Push(compactTx);
			}
		}
	}

	log.RequestId().trace("FINISHED JOB(QueryTx|id:%s|type:%s) , blocks[%d,%d], TotalJobs=%d",
		opts.jobId, opts.txType, opts.fromBlock, opts.toBlock, queryTxJobs.length());

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

	// Init progress bar
	const totalProgress = blockNumber - nextFrom;
	const progress = NewProgressBar(totalProgress);

	do {
		await util.time.SleepMilliseconds(opts.pushJobIntervals);

		leftBlocks = blockNumber - nextFrom;
		if (leftBlocks <= 0) {
			if (!opts.keepRunning) {
				UpdateProgressBar(progress, totalProgress);
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

		const jobOpts = {
			jobId: NewJobID(),      // Job ID
			txType: opts.txType,    // Transaction type: transfer
			fromBlock: nextFrom,    // Fetch from block number
			toBlock: nextTo,        // Fetch to block number
		}
		log.RequestId().trace("PUSH JOB(QueryTx|id:%s|type:%s), blocks[%d,%d](range=%d), TotalJobs=%d",
			jobOpts.jobId, opts.txType, nextFrom, nextTo, blockRange, queryTxJobs.length());
		queryTxJobs.push(jobOpts).catch((err) => log.RequestId().error(err));

		// Update progress
		UpdateProgressBar(progress, nextTo - nextFrom);

		nextFrom = nextTo + 1;
	} while (nextFrom > 0);

	log.RequestId().info("All JOBs(QueryTx) are scheduled, options=%o", opts);

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
