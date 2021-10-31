
import knex, { Knex } from "knex";
import { v4 } from "uuid";
import TableBuilder = Knex.TableBuilder;

if (process.env.NODE_ENV !== 'production')
    require('dotenv').config({ path: require('find-config')('.env') })
class AbstractRepository {
    knex: Knex<any, unknown[]>;
    constructor() {
        this.knex = knex({
            client: 'pg',
            connection: process.env.NODE_ENV === 'production' ? {
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false },
            } : {
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT),
                user: process.env.DB_USER,
                password: process.env.DB_PSWD,
                database: process.env.DB_DATABASE
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

    fetchTables(): Promise<string[]> {
        const query = 'SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_catalog = ?';
        const bindings = [this.knex.client.database()];

        return this.knex.raw(query, bindings).then(function (results) {
            return results.rows.map((row) => row.table_name);
        });
    }

    fetchAllOnCondition(tableName: string, objClause: {}, returningFields = ['*']): Promise<object[]> {
        return this.knex
            .select(...returningFields)
            .table(tableName)
            .where(objClause);
    }

    async fetchFirstOnCondition(tableName: string, clause: {}, returningFields = ['*']): Promise<object | null> {
        const res = await this.knex
            .select(...returningFields)
            .table(tableName)
            .where(clause)
            .first();
        return res ?? null;
    }

    updateRow(tableName: string, clause: {}, newRow: {}, returnings?: string[]) {
        return this.knex(tableName)
            .where(clause)
            .update(newRow, returnings)
            .first()
    }

    updateRows(tableName: string, clause: {}, newRow: {}, returnings?: string[]) {
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

function getTableNames() {
    return DB.fetchTables();
}

function create(
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

function saveBatch(tableName: string, rows: object[], returning: string = '*') {
    return DB.addRows(tableName, rows, returning);
}

async function findOne(tableName: string, clause: {}, returnings: string[] = ['*']) {
    return DB.fetchFirstOnCondition(tableName, clause, returnings);
}

async function findAll(tableName: string, clause: {}, returnings: string[] = ['*']) {
    return DB.fetchAllOnCondition(tableName, clause, returnings);
}

async function updateAll(tableName: string, clause: {}, newRow: {}, returnings: string[] = ['*']) {
    return DB.updateRows(
        tableName,
        clause,
        newRow,
        returnings
    );
}

/**
 * 
 * @param multitude number of rows to affect
 * @param tableName name of the table
 * @param clause which rows to affect
 * @returns number of affected rows
 */
function deleteBatch(
    tableName: string,
    clause: {}) {
    return DB.dropRows(tableName, clause);
}

export { create, saveBatch, findOne, findAll, updateAll, deleteBatch, getTableNames };

