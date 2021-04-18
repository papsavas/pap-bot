import knex, {Knex} from "knex";
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
    return knexClient.schema.createTable(tableName, callback);
}

export function returnTable(tableName: string, fields = ['*']): Promise<{ key: any, value: any }[]> {
    return knexClient.select(...fields).table(tableName);
}

export function readRow(table: string, column: string, value: string): Promise<any> {
    return knexClient(table)
        .where(column, value)
        .first();

}

export function addRow(table, row, returnings?: string[]): Promise<any> {
    return knexClient(table).insert(row)
        .returning(returnings);
}

export function addRows(table, rows, returning?: string, size?: number): Promise<any> {
    return knexClient.batchInsert(table, rows, size)
        .returning(returning);
}

export function dropRow(table: string, field: string, value: string): Promise<number> {
    return knexClient(table)
        .where(field, value)
        .del();
}

