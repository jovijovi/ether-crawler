import {Sqlite} from '@jovijovi/pedrojs-sqlite';
import {customConfig} from '../../config';
import {DefaultIndexes, ICompactTx, ModelAttrsMapper, ModelName, TableName} from './model';
import {Database} from './interface';
import {DatabaseType} from './constants';

export class SqliteDB extends Database {
	async Connect(): Promise<Sqlite.Engine> {
		// Connect
		const engine = Sqlite.Connect({
			uri: customConfig.GetSqliteConfig().uri,
		});

		// Ping
		await engine.Ping();

		// Model options
		const opts = {
			tableName: customConfig.GetSqliteConfig().table ? customConfig.GetSqliteConfig().table : TableName,
			timestamps: false,
			indexes: DefaultIndexes,
		};

		// Define model
		this.ModelTx = engine.client.define<ICompactTx>(ModelName, ModelAttrsMapper.get(DatabaseType.Sqlite), opts);

		// Creates the table if it doesn't exist (and does nothing if it already exists)
		await this.ModelTx.sync();

		return engine;
	}
}

export const SqliteClient = new SqliteDB();
