import got from 'got';
import fastq, {queueAsPromised} from 'fastq';
import {auditor, log, util} from '@jovijovi/pedrojs-common';
import {customConfig} from '../config';
import {CompactTx, Response} from './types';
import {RandomRetryInterval} from './common';
import {DefaultLoopInterval, DefaultRetryTimes} from './params';

// Callback queue (ASC, FIFO)
const callbackQueue = new util.Queue<CompactTx>();

// Callback job
const callbackJob: queueAsPromised<util.Queue<CompactTx>> = fastq.promise(callback, 1);

// Schedule processing job
export async function Run() {
	let isEmpty = true;
	setInterval(() => {
		auditor.Check(callbackQueue, "Callback queue is nil");
		if (callbackQueue.Length() === 0) {
			if (!isEmpty) {
				log.RequestId().info("All callback finished, queue is empty");
				isEmpty = true;
			}
			return;
		}

		callbackJob.push(callbackQueue).catch((err) => log.RequestId().error(err));
		isEmpty = false;
	}, DefaultLoopInterval);
}

// Push tx to callback queue
export function Push(tx: CompactTx) {
	callbackQueue.Push(tx);
}

// Tx callback
async function callback(queue: util.Queue<CompactTx>): Promise<void> {
	const conf = customConfig.GetCrawler();

	// Check URL
	if (!conf.callback) {
		return;
	}

	const len = queue.Length();
	if (len === 0) {
		return;
	}

	for (let i = 0; i < len; i++) {
		const tx = queue.Shift();

		// Callback
		log.RequestId().debug("Crawler calling back(%s)... txHash=%s", conf.callback, tx.txHash);

		try {
			const rsp: Response = await util.retry.Run(async (): Promise<Response> => {
				return got.post(conf.callback, {
					json: tx
				}).json();
			}, DefaultRetryTimes, RandomRetryInterval(), false);

			log.RequestId().trace("Crawler tx(%s) callback response=%o", tx.txHash, rsp);
		} catch (e) {
			log.RequestId().error("Crawler tx(%s) callback failed, error=%o", tx.txHash, e.message);
		}
	}

	return;
}
