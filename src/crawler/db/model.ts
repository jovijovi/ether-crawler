import {DataTypes, Model} from 'sequelize';
import {CompactTx} from '../types';
import {DatabaseType} from './constants';

export interface ICompactTx extends Model, CompactTx {
}

// Model name
export const ModelName = 'CompactTx';

// Default model attributes
export const DefaultModelAttrs = {
	block_number: {
		type: DataTypes.BIGINT,
		allowNull: false,
	},
	block_hash: {
		type: DataTypes.STRING(66),
		allowNull: false,
	},
	block_timestamp: {
		type: DataTypes.BIGINT,
		allowNull: false,
	},
	block_datetime: {
		type: DataTypes.STRING(255),
		allowNull: false,
	},
	transaction_hash: {
		type: DataTypes.STRING(66),
		allowNull: false,
		primaryKey: true,
	},
	from: {
		type: DataTypes.STRING(42),
		allowNull: false,
	},
	to: {
		type: DataTypes.STRING(42),
		allowNull: false,
	},
	value: {
		type: DataTypes.DECIMAL,
		allowNull: true,
	},
	ether_value: {
		type: DataTypes.TEXT,
		allowNull: true,
	},
	nonce: {
		type: DataTypes.BIGINT,
		allowNull: false,
	},
	status: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	gas_limit: {
		type: DataTypes.DECIMAL,
		allowNull: false,
	},
	gas_price: {
		type: DataTypes.DECIMAL,
		allowNull: true,
	},
	gas_used: {
		type: DataTypes.DECIMAL,
		allowNull: true,
	},
};

// Mysql model attributes
export const ModelAttrsMysql = {
	block_number: {
		type: DataTypes.BIGINT,
		allowNull: false,
	},
	block_hash: {
		type: DataTypes.STRING(66),
		allowNull: false,
	},
	block_timestamp: {
		type: DataTypes.BIGINT,
		allowNull: false,
	},
	block_datetime: {
		type: DataTypes.STRING(255),
		allowNull: false,
	},
	transaction_hash: {
		type: DataTypes.STRING(66),
		allowNull: false,
		primaryKey: true,
	},
	from: {
		type: DataTypes.STRING(42),
		allowNull: false,
	},
	to: {
		type: DataTypes.STRING(42),
		allowNull: false,
	},
	value: {
		// The maximum number of digits for DECIMAL is 65.
		// Ref: https://dev.mysql.com/doc/refman/8.0/en/fixed-point-types.html
		type: DataTypes.DECIMAL(65),
		allowNull: true,
	},
	ether_value: {
		type: DataTypes.TEXT,
		allowNull: true,
	},
	nonce: {
		type: DataTypes.BIGINT,
		allowNull: false,
	},
	status: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	gas_limit: {
		type: DataTypes.DECIMAL(65),
		allowNull: false,
	},
	gas_price: {
		type: DataTypes.DECIMAL(65),
		allowNull: true,
	},
	gas_used: {
		type: DataTypes.DECIMAL(65),
		allowNull: true,
	},
};

// Database model attributes mapper
export const ModelAttrsMapper: Map<string, any> = new Map([
	[DatabaseType.Postgres, DefaultModelAttrs],
	[DatabaseType.Sqlite, DefaultModelAttrs],
	[DatabaseType.Mysql, ModelAttrsMysql as any],
]);

// Default indexes
export const DefaultIndexes = [{
	name: 'transactions_transaction_hash',
	using: 'BTREE',
	unique: true,
	fields: ['transaction_hash'],
}];

export const TableName = 'transactions';
