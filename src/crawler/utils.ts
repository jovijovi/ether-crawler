import {BigNumber} from 'ethers';
import {TransactionResponse} from '@ethersproject/abstract-provider';
import {TxTypeTransfer} from './constants';

// Check transaction type
export function CheckTxType(tx: TransactionResponse, txType: string[]): boolean {
	// TxType: Transfer
	if (tx.value.gt(BigNumber.from(0))
		&& txType.includes(TxTypeTransfer)) {
		return true;
	}

	return false;
}
