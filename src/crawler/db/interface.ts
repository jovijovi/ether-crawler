import {utils} from 'ethers';
import {ModelCtor} from 'sequelize';
import {log} from '@jovijovi/pedrojs-common';
import {CompactTx} from '../types';
import {ICompactTx} from './model';

interface IDatabase {
	ModelTx: ModelCtor<ICompactTx>;

	Save(tx: CompactTx): Promise<any>;
}

export class Database implements IDatabase {
	public ModelTx: ModelCtor<ICompactTx>;

	// Save tx to database
	async Save(tx: CompactTx): Promise<any> {
		try {
			return await this.ModelTx.upsert({
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
		} catch (e) {
			log.RequestId().error('Save tx failed, error=', e.message);
		}

		return;
	}

	// Save records in bulk, ignore duplicates
	async BulkSave(records: any[]): Promise<any> {
		try {
			await this.ModelTx.bulkCreate(records,
				{
					ignoreDuplicates: true,
				}
			);
		} catch (e) {
			log.RequestId().error('BulkSave failed, error=', e.message);
		}
	}

	// Check if tx is exists
	async IsTxExists(txHash: string): Promise<boolean> {
		try {
			return await this.ModelTx.count({
				where: {
					transaction_hash: txHash
				},
			}) > 0;
		} catch (e) {
			log.RequestId().error('IsExist failed, error=', e.message);
		}
	}
}


