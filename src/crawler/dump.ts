import {utils} from 'ethers';
import fastq, {queueAsPromised} from 'fastq';
import {auditor, log, util} from '@jovijovi/pedrojs-common';
import {customConfig} from '../config';
import {CompactTx} from './types';
import {DB} from './db';
import {DefaultChunkSize, DefaultLoopInterval} from './params';
import {NewJobID} from './utils';

// Compact tx queue (ASC, FIFO)
const txQueue = new util.Queue<CompactTx>();

// Dump job
const dumpJob: queueAsPromised<util.Queue<CompactTx>> = fastq.promise(dump, 1);

// Schedule dump job
export async function Run() {
	let isEmpty = true;
	setInterval(() => {
		auditor.Check(txQueue, "Tx queue is nil");
		if (txQueue.Length() === 0) {
			if (!isEmpty) {
				log.RequestId().info("All tx dumped, queue is empty");
				isEmpty = true;
			}
			return;
		}

		dumpJob.push(txQueue).catch((err) => log.RequestId().error(err));
		isEmpty = false;
	}, DefaultLoopInterval);
}

export function Push(tx: CompactTx) {
	txQueue.Push(tx);
}

// Dump tx
async function dump(queue: util.Queue<CompactTx>): Promise<void> {
	try {
		const len = queue.Length();
		if (len === 0) {
			return;
		}

		const conf = customConfig.GetCrawler();
		const defaultChunkSize = conf.chunkSize ? conf.chunkSize : DefaultChunkSize;
		const jobId = NewJobID();

		let leftTxs = len;
		do {
			const chunkSize = leftTxs < defaultChunkSize ? leftTxs : defaultChunkSize;

			const txs = [];
			for (let i = 0; i < chunkSize; i++) {
				const tx = queue.Shift();

				txs.push({
					block_number: tx.blockNumber,
					block_hash: tx.blockHash,
					block_timestamp: tx.blockTimestamp,
					block_datetime: tx.blockDatetime,
					transaction_hash: tx.txHash,
					from: tx.from,
					to: tx.to,
					value: tx.value,
					ether_value: utils.formatEther(tx.value),
					nonce: tx.nonce,
					status: tx.status,
					gas_limit: tx.gasLimit,
					gas_price: tx.gasPrice,
					gas_used: tx.gasUsed,
				});
			}

			// Save txs in bulk
			await DB.Client().BulkSave(txs);

			// Calc left txs
			leftTxs -= chunkSize;

			log.RequestId().debug("EXEC JOB(Dump|id:%s), %d txs dumped, progress=%d%(%d/%d), lastBlockInChunk=%s",
				jobId,
				txs.length,
				((len - leftTxs) * 100 / len).toFixed(1),
				len - leftTxs,
				len,
				txs[chunkSize - 1].block_number,
			);
		} while (leftTxs > 0);
	} catch (e) {
		log.RequestId().error("Dump failed, error=", e);
		return;
	}

	return;
}
