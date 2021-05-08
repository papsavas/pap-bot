/**
 * @deprecated 
*/

import knex, { Knex } from "knex";
import { v4 } from "uuid";
import { inDevelopment } from "..";
import TableBuilder = Knex.TableBuilder;

require('dotenv').config();


const knexClient = knex({
    client: 'pg',
    connection: process.env.NODE_ENV == 'development' ? {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PSWD,
        database: process.env.DB_DATABASE
    } : {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    },
    useNullAsDefault: true,

});

export function createTable(tableName: string, callback?: (tableBuilder: TableBuilder) => any): Promise<any> {
    return knexClient.schema
        .createTable(tableName, callback);
}

export function fetchTable(tableName: string, fields = ['*']): Promise<{ key: any, value: any }[]> {
    return knexClient
        .select(...fields)
        .table(tableName);
}

export function fetchAllOnCondition(tableName: string, objClause: {}, returningFields = ['*']): Promise<any[]> {
    return knexClient
        .select(...returningFields)
        .table(tableName)
        .where(objClause);
}

export function fetchFirstOnCondition(tableName: string, columnName: string, value: any, returningFields = ['*']): Promise<object> {
    return knexClient
        .select(...returningFields)
        .table(tableName)
        .where(columnName, value)
        .first();
}

export function readFirstRow(table: string, column: string, value: string): Promise<any> {
    return knexClient(table)
        .where(column, value)
        .first();

}

export function updateRow(tableName: string, clause: {}, newRow: {}, returnings?: string[]): Promise<any> {
    return knexClient(tableName)
        .where(clause)
        .update(newRow, returnings)
        .returning(returnings)
}

export function updateRowOnMultConditions(tableName: string, objClause: {}, newRow: {}, returnings?: string[]): Promise<any> {
    return knexClient(tableName)
        .where(objClause)
        .update(newRow, returnings)
}

export async function addRow(tableName: string, row, returnings?: string[]): Promise<any> {
    if (await knexClient.schema.hasColumn(tableName, "uuid")) {
        Object.assign(row, row, { "uuid": v4() });
    }
    return knexClient(tableName).insert(row)
        .returning(returnings);
}

export async function addRows(table, rows, returning?: string, size?: number): Promise<any> {
    if (await knexClient.schema.hasColumn(table, "uuid"))
        for (let row of rows)
            Object.assign(row, { "uuid": v4() });
    return knexClient.batchInsert(table, rows, size)
        .returning(returning);
}

export function dropRows(table: string, objClause: {}): Promise<number> {
    return knexClient(table)
        .where(objClause)
        .del();
}

