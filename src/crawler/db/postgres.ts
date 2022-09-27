import {Sequelize} from 'sequelize';
import {Postgresql} from '@jovijovi/pedrojs-pg';
import {customConfig} from '../../config';
import {ICompactTx, ModelAttrsMapper, ModelName, TableName} from './model';
import {Database} from './interface';
import {DatabaseType} from './constants';

export class PostgresDB extends Database {
	private _engine: Sequelize;

	// Connect database
	async Connect() {
		if (this._engine) {
			return;
		}

		// Connect
		const e = Postgresql.Connect({
			uri: customConfig.GetPostgresConfig().uri,
		});

		// Ping
		await Postgresql.Ping(e);

		// Model options
		const opts = {
			tableName: customConfig.GetPostgresConfig().table ? customConfig.GetPostgresConfig().table : TableName,
			timestamps: false,
		};

		// Define model
		this.ModelTx = e.define<ICompactTx>(ModelName, ModelAttrsMapper.get(DatabaseType.Postgres), opts);

		// Creates the table if it doesn't exist (and does nothing if it already exists)
		await this.ModelTx.sync();

		this._engine = e;
	}
}

export const PostgresClient = new PostgresDB();
