import {customConfig} from '../../config';
import {auditor} from '@jovijovi/pedrojs-common';
import {DatabaseType} from './constants';
import {PostgresClient, PostgresDB} from './postgres';
import {MysqlClient, MysqlDB} from './mysql';
import {SqliteClient, SqliteDB} from './sqlite3';

class DBClient {
	private _client: PostgresDB | MysqlDB | SqliteDB;

	async Connect() {
		auditor.Check(customConfig.GetCrawler().db, "Database config is empty");
		switch (customConfig.GetCrawler().db) {
			case DatabaseType.Postgres:
				await PostgresClient.Connect();
				this._client = PostgresClient;
				break;
			case DatabaseType.Mysql:
				await MysqlClient.Connect();
				this._client = MysqlClient;
				break;
			case DatabaseType.Sqlite:
				await SqliteClient.Connect();
				this._client = SqliteClient;
				break;
		}
	}

	Client() {
		return this._client;
	}
}

export const DB = new DBClient();
