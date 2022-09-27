import {config} from '@jovijovi/pedrojs-common';
import {Postgresql} from '@jovijovi/pedrojs-pg';
import {Mysql} from '@jovijovi/pedrojs-mysql';
import {Sqlite} from '@jovijovi/pedrojs-sqlite';

export namespace customConfig {
	class TxConfig {
		gasLimitC: number
		confirmations: number
	}

	export class CrawlerConfig {
		enable: boolean
		txType: string[]
		callback: string
		fromBlock: number
		toBlock: number
		maxBlockRange?: number
		pushJobIntervals?: number
		executeJobConcurrency?: number
		keepRunning?: boolean
		forceUpdate?: boolean
		db: string
	}

	interface PostgresqlConfig extends Postgresql.Config {
		table: string
	}

	interface MysqlConfig extends Mysql.Config {
		table: string
	}

	interface SqliteConfig extends Sqlite.Config {
		table: string
	}

	class DatabaseConfig {
		postgres: PostgresqlConfig
		mysql: MysqlConfig
		sqlite: SqliteConfig
	}

	export class CustomConfig {
		apiResponseCode: any
		tx: TxConfig
		crawler: CrawlerConfig
		database?: DatabaseConfig
	}

	let customConfig: CustomConfig;

	export function LoadCustomConfig() {
		customConfig = config.GetYmlConfig().custom;
	}

	export function Get() {
		return customConfig;
	}

	// GetTxConfig returns tx config
	export function GetTxConfig(): TxConfig {
		return customConfig.tx;
	}

	// GetCrawler returns crawler config
	export function GetCrawler(): CrawlerConfig {
		if (customConfig.crawler) {
			return customConfig.crawler;
		}
	}

	// GetPostgresConfig returns postgres database config
	export function GetPostgresConfig(): PostgresqlConfig {
		return customConfig.database.postgres;
	}

	// GetMysqlConfig returns mysql database config
	export function GetMysqlConfig(): MysqlConfig {
		return customConfig.database.mysql;
	}

	// GetSqliteConfig returns sqlite database config
	export function GetSqliteConfig(): SqliteConfig {
		return customConfig.database.sqlite;
	}

	// GetRestAPIRspCode returns Rest API response code
	export function GetRestAPIRspCode(): any {
		if (customConfig.apiResponseCode) {
			return customConfig.apiResponseCode;
		}

		throw new Error(`GetRestAPIRspCode Failed, invalid config`);
	}
}
