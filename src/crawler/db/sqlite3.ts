import {Sqlite} from '@jovijovi/pedrojs-sqlite';
import {customConfig} from '../../config';
import {ICompactTx, ModelAttrs, ModelName, TableName} from './model';
import {Database} from './interface';

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
		};

		// Define model
		this.ModelTx = engine.client.define<ICompactTx>(ModelName, ModelAttrs, opts);

		// Creates the table if it doesn't exist (and does nothing if it already exists)
		await this.ModelTx.sync();

		return engine;
	}
}

export const SqliteClient = new SqliteDB();
