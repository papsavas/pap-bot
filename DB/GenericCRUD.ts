
import knex, { Knex } from "knex";
import { v4 } from "uuid";
import TableBuilder = Knex.TableBuilder;

require('dotenv').config({ path: '../.env' });

class AbstractRepository {
    knex: Knex<any, unknown[]>;
    constructor() {
        this.knex = knex({
            client: 'pg',
            connection: process.env.NODE_ENV === 'development' ? {
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

    fetchAllOnCondition(tableName: string, objClause: {}, returningFields = ['*']): Promise<object[]> {
        return this.knex
            .select(...returningFields)
            .table(tableName)
            .where(objClause);
    }

    fetchFirstOnCondition(tableName: string, clause: {}, returningFields = ['*']): Promise<object> {
        return this.knex
            .select(...returningFields)
            .table(tableName)
            .where(clause)
            .first();
    }

    updateRow(tableName: string, clause: {}, newRow: {}, returnings?: string[]): Promise<any> {
        return this.knex(tableName)
            .where(clause)
            .update(newRow, returnings)
            .first()
    }

    updateRows(tableName: string, clause: {}, newRow: {}, returnings?: string[]): Promise<any> {
        return this.knex(tableName)
            .where(clause)
            .update(newRow, returnings)
    }

    async addRows(tableName: string, rows: any[], returning?: string, size?: number) {
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

    dropRow(table: string, objClause: {}): Promise<number> {
        return this.knex(table)
            .where(objClause)
            .first()
            .del();
    }
}

const DB = new AbstractRepository();

type multitudeType = "one" | "1" | 1 | "all";

type createType = "integer"
    | "bigInteger"
    | "text"
    | "string"
    | "float"
    | "double"
    | "decimal"
    | "boolean"
    | "date"
    | "time"
    | "datetime"
    | "json"
    | "jsonb"
    | "uuid"
    | "array"
    | "object"
    | "enum"

export function createData(
    name: string,
    columns: {
        name: string,
        type: createType,
        nullable: boolean
    }[],
    timestamps: boolean = false
) {
    return DB.createTable(name, (tableBuilder: TableBuilder) => {
        columns.forEach(col => {
            col.nullable ?
                tableBuilder[col.type](col.name) :
                tableBuilder[col.type](col.name).notNullable();
        });
        tableBuilder.uuid('uuid')
            .primary()
            .unique()
            .notNullable();
        if (timestamps)
            tableBuilder.timestamps(true, true)
    });
}

export function addData(tableName: string, rows: {}[], returning?: string) {
    return DB.addRows(tableName, rows, returning);
}

export async function readData(multitude: multitudeType, tableName: string, clause: {}, returnings: string[]): Promise<object[]> {
    if (multitude === "all")
        return DB.fetchAllOnCondition(
            tableName,
            clause,
            returnings
        );
    else if (multitude === "one" || multitude === "1" || multitude === 1)
        return [
            await DB.fetchFirstOnCondition(
                tableName,
                clause,
                Array.isArray(returnings) ? returnings : [returnings])
        ];
}

export function updateData(multitude: multitudeType, tableName: string, clause: {}, newRow: {}, returnings?: string[]) {
    if (multitude === "all")
        return DB.updateRows(
            tableName,
            clause,
            newRow,
            returnings
        );
    else
        return DB.updateRow(
            tableName,
            clause,
            newRow,
            returnings
        );
}

export function deleteData(
    multitude: multitudeType,
    tableName: string,
    clause: {}) {
    if (multitude === "all")
        return DB.dropRows(tableName, clause);
    else
        return DB.dropRow(tableName, clause);
}
