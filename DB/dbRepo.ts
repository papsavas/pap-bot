import knex from "knex";

require('dotenv').config();

const Knex = knex({
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

export function returnTable(tableName: string, fields = ['*']) { //returns object, not custom type
    return Knex.select(...fields).table(tableName);
}

export function readRow(table: string, column: string, value: string): Promise<any> {
    return Knex(table)
        .where(column, value)
        .first();

}

export function addRow(table, row, returnings?: string[]): Promise<any> {
    return Knex(table).insert(row)
        .returning(returnings)
}

export function addRows(table, rows, returning?: string, size?: number): Promise<any> {
    return Knex.batchInsert(table, rows, size)
        .returning(returning)
}

export function dropRow(table: string, field: string, value: string): Promise<number> {
    return Knex(table)
        .where(field, value)
        .del()
}

