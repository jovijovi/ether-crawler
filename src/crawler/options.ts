export type Options = {
	jobId?: string              // Job ID
	txType: string[]            // Transaction type
	abi?: any
	address?: string            // The address to filter by, or null to match any address (Optional)
	fromBlock: number           // Fetch from block number
	toBlock?: number            // Fetch to block number (Optional, the highest block number by default)
	maxBlockRange?: number      // eth_getLogs block range (Optional)
	pushJobIntervals?: number   // Push job intervals (unit: ms)
	keepRunning?: boolean       // Keep running fetcher (Optional)
}
