"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const knex_1 = require("knex");
const uuid_1 = require("uuid");
require('dotenv').config();
class AbstractRepository {
    constructor() {
        this.knex = knex_1.default({
            client: 'pg',
            connection: {
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT),
                user: process.env.DB_USER,
                password: process.env.DB_PSWD,
                database: process.env.DB_DATABASE
            },
            useNullAsDefault: true
        });
    }
    createTable(tableName, callback) {
        return this.knex.schema
            .createTable(tableName, callback);
    }
    fetchTable(tableName, fields = ['*']) {
        return this.knex
            .select(...fields)
            .table(tableName);
    }
    fetchAllOnCondition(tableName, objClause, returningFields = ['*']) {
        return this.knex
            .select(...returningFields)
            .table(tableName)
            .where(objClause);
    }
    fetchFirstOnCondition(tableName, columnName, value, returningFields = ['*']) {
        return this.knex
            .select(...returningFields)
            .table(tableName)
            .where(columnName, value)
            .first();
    }
    readFirstRow(table, column, value) {
        return this.knex(table)
            .where(column, value)
            .first();
    }
    updateRow(tableName, column, value, newRow, returnings) {
        return this.knex(tableName)
            .where(column, value)
            .update(newRow, returnings);
    }
    updateRowOnMultConditions(tableName, objClause, newRow, returnings) {
        return this.knex(tableName)
            .where(objClause)
            .update(newRow, returnings);
    }
    async addRow(tableName, row, returnings) {
        if (await this.knex.schema.hasColumn(tableName, "uuid")) {
            Object.assign(row, row, { "uuid": uuid_1.v4() });
        }
        return this.knex(tableName).insert(row)
            .returning(returnings);
    }
    async addRows(tableName, rows, returning, size) {
        if (await this.knex.schema.hasColumn(tableName, "uuid"))
            for (let row of rows)
                Object.assign(row, { "uuid": uuid_1.v4() });
        return this.knex.batchInsert(tableName, rows, size)
            .returning(returning);
    }
    dropRows(table, objClause) {
        return this.knex(table)
            .where(objClause)
            .del();
    }
}
const DB = new AbstractRepository();
/*
export function read(multitude: multitudeType, tableName: string, clause: {}, returnings: string | string[]) {

}
*/ 
