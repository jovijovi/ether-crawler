import {log, util} from '@jovijovi/pedrojs-common';
import {network} from '@jovijovi/ether-network';
import {DefaultRetryInterval, DefaultRetryTimes} from './params';

// GetBlockNumber returns block number
export async function GetBlockNumber(): Promise<number> {
	const provider = network.MyProvider.Get();
	const blockNumber = await util.retry.Run(async (): Promise<number> => {
		return await provider.getBlockNumber();
	}, DefaultRetryTimes, DefaultRetryInterval, false);
	log.RequestId().trace("Current BlockNumber=", blockNumber);
	return blockNumber;
}
