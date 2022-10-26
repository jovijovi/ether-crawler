import {BigNumber} from 'ethers';
import {TransactionResponse} from '@ethersproject/abstract-provider';
import {util} from '@jovijovi/pedrojs-common';
import {TxTypeTransfer} from './constants';
import {DefaultJobIDLength, DefaultNanoIDAlphabet} from './params';

// Check transaction type
export function CheckTxType(tx: TransactionResponse, txType: string[]): boolean {
	// TxType: Transfer
	if (tx.value.gt(BigNumber.from(0))
		&& txType.includes(TxTypeTransfer)) {
		return true;
	}

	return false;
}

// New job ID
export function NewJobID(): string {
	return util.nanoid.NewNanoID({
		alphabet: DefaultNanoIDAlphabet,
		size: DefaultJobIDLength,
	});
}
