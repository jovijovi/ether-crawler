export type Options = {
	txType: string[]
	abi?: any
	address?: string
	fromBlock: number
	toBlock?: number
	maxBlockRange?: number
	pushJobIntervals?: number
	keepRunning?: boolean
}
