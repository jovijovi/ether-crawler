import {log, util} from '@jovijovi/pedrojs-common';
import {network} from '@jovijovi/ether-network';
import {DefaultRetryMaxInterval, DefaultRetryMinInterval, DefaultRetryTimes} from './params';

// GetBlockNumber returns block number
export async function GetBlockNumber(): Promise<number> {
	const provider = network.MyProvider.Get();
	const blockNumber = await util.retry.Run(async (): Promise<number> => {
		return await provider.getBlockNumber();
	}, DefaultRetryTimes, RandomRetryInterval(), false);
	log.RequestId().trace("Current BlockNumber=", blockNumber);
	return blockNumber;
}

// Random retry interval
export function RandomRetryInterval(): number {
	return util.retry.RandomRetryInterval(DefaultRetryMinInterval, DefaultRetryMaxInterval);
}
