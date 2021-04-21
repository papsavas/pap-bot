import knex, {Knex} from "knex";
import {v4} from "uuid";
import TableBuilder = Knex.TableBuilder;

require('dotenv').config();

const knexClient = knex({
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

export function createTable(tableName: string, callback?: (tableBuilder: TableBuilder) => any): Promise<any> {
    return knexClient.schema
        .createTable(tableName, callback);
}

export function fetchTable(tableName: string, fields = ['*']): Promise<{ key: any, value: any }[]> {
    return knexClient
        .select(...fields)
        .table(tableName);
}

export function fetchAllOnCondition(tableName: string, columnName: string, value: any, returningFields = ['*']): Promise<any[]> {
    return knexClient
        .select(...returningFields)
        .table(tableName)
        .where(columnName, value);
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

export function updateRow(tableName: string, column:string, value: string, newRow :{},returnings?: string[]): Promise<any>{
    return knexClient(tableName)
        .where(column, value)
        .update(newRow, returnings)
}

export async function addRow(table, row, returnings?: string[]): Promise<any> {
    if (await knexClient.schema.hasColumn(table, "uuid")) {
        Object.assign(row, row, {"uuid": v4()});
    }
    return knexClient(table).insert(row)
        .returning(returnings);
}

export function addRows(table, rows, returning?: string, size?: number): Promise<any> {
    knexClient.schema.hasColumn(table, "uuid")
        .then((exists) => {
            if (exists)
                rows.forEach((row) => Object.assign(row, row, {"uuid": v4()}));
        })
        .catch();
    return knexClient.batchInsert(table, rows, size)
        .returning(returning);
}

export function dropRows(table: string, field: string, value: string): Promise<number> {
    return knexClient(table)
        .where(field, value)
        .del();
}

