import {DataTypes, Model} from 'sequelize';
import {CompactTx} from '../types';

export interface ICompactTx extends Model, CompactTx {
}

// Model name
export const ModelName = 'CompactTx';

// Model attributes
export const ModelAttrs = {
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

export const TableName = 'transactions';
