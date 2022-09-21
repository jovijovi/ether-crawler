import {ModelCtor} from 'sequelize';
import {log, util} from '@jovijovi/pedrojs-common';
import {CompactTx} from '../types';
import {ICompactTx} from './model';

interface IDatabase {
	ModelTx: ModelCtor<ICompactTx>;

	Save(tx: CompactTx): Promise<any>;
}

export class Database implements IDatabase {
	public ModelTx: ModelCtor<ICompactTx>;

	// Save event to database
	async Save(tx: CompactTx): Promise<any> {
		try {
			return await this.ModelTx.upsert({
				block_number: tx.blockNumber,
				block_hash: tx.blockHash,
				block_timestamp: tx.blockTimestamp,
				block_datetime: util.time.GetUnixTimestamp(tx.blockTimestamp, 'UTC'),
				transaction_hash: tx.txHash,
				from: tx.from,
				to: tx.to,
				value: tx.value,
				nonce: tx.nonce,
				status: tx.status,
				gas_limit: tx.gasLimit,
				gas_price: tx.gasPrice,
				gas_used: tx.gasUsed,
			});
		} catch (e) {
			log.RequestId().error('Save tx failed, error=', e.message);
		}

		return;
	}
}


