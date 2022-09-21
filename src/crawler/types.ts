import {BigNumber} from 'ethers';

// Compact Transaction(Tx) Object
export type CompactTx = {
	blockNumber: number     // Block number
	blockHash: string       // Block hash
	blockTimestamp: number  // Block timestamp
	txHash: string          // Tx hash
	from: string            // From
	to: string              // To
	value?: BigNumber       // Value
	nonce: number           // Tx nonce
	status?: number         // Tx status
	gasLimit: BigNumber     // Tx gas limit
	gasPrice?: BigNumber    // Tx gas price
	gasUsed?: BigNumber     // Tx gas used
}

// Response of Restful API
export type Response = {
	code: string
	msg: string
	data?: object
}
