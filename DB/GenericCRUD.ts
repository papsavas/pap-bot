
import knex, { Knex } from "knex";
import { v4 } from "uuid";
import TableBuilder = Knex.TableBuilder;

require('dotenv').config();

class AbstractRepository {
    knex: Knex<any, unknown[]>;
    constructor() {
        this.knex = knex({
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
    }

    createTable(tableName: string, callback?: (tableBuilder: TableBuilder) => any): Promise<any> {
        return this.knex.schema
            .createTable(tableName, callback);
    }

    fetchTable(tableName: string, fields = ['*']): Promise<{ key: any, value: any }[]> {
        return this.knex
            .select(...fields)
            .table(tableName);
    }

    fetchAllOnCondition(tableName: string, objClause: {}, returningFields = ['*']): Promise<any[]> {
        return this.knex
            .select(...returningFields)
            .table(tableName)
            .where(objClause);
    }

    fetchFirstOnCondition(tableName: string, columnName: string, value: any, returningFields = ['*']): Promise<object> {
        return this.knex
            .select(...returningFields)
            .table(tableName)
            .where(columnName, value)
            .first();
    }

    readFirstRow(table: string, column: string, value: string): Promise<any> {
        return this.knex(table)
            .where(column, value)
            .first();

    }

    updateRow(tableName: string, column: string, value: string, newRow: {}, returnings?: string[]): Promise<any> {
        return this.knex(tableName)
            .where(column, value)
            .update(newRow, returnings)
    }

    updateRowOnMultConditions(tableName: string, objClause: {}, newRow: {}, returnings?: string[]): Promise<any> {
        return this.knex(tableName)
            .where(objClause)
            .update(newRow, returnings)
    }

    async addRow(tableName: string, row, returnings?: string[]): Promise<any> {
        if (await this.knex.schema.hasColumn(tableName, "uuid")) {
            Object.assign(row, row, { "uuid": v4() });
        }
        return this.knex(tableName).insert(row)
            .returning(returnings);
    }

    async addRows(tableName: string, rows: any[], returning?: string, size?: number): Promise<any> {
        if (await this.knex.schema.hasColumn(tableName, "uuid"))
            for (let row of rows)
                Object.assign(row, { "uuid": v4() });
        return this.knex.batchInsert(tableName, rows, size)
            .returning(returning);
    }

    dropRows(table: string, objClause: {}): Promise<number> {
        return this.knex(table)
            .where(objClause)
            .del();
    }
}

const DB = new AbstractRepository();

type multitudeType = "one" | "1" | "all";

/*
export function read(multitude: multitudeType, tableName: string, clause: {}, returnings: string | string[]) {

}
*/