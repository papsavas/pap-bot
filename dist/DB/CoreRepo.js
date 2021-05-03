"use strict";
/**
 * @deprecated
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.dropRows = exports.addRows = exports.addRow = exports.updateRowOnMultConditions = exports.updateRow = exports.readFirstRow = exports.fetchFirstOnCondition = exports.fetchAllOnCondition = exports.fetchTable = exports.createTable = void 0;
const knex_1 = require("knex");
const uuid_1 = require("uuid");
require('dotenv').config();
const knexClient = knex_1.default({
    client: 'pg',
    connection: process.env.DATABASE_URL || {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PSWD,
        database: process.env.DB_DATABASE
    },
    useNullAsDefault: true
});
function createTable(tableName, callback) {
    return knexClient.schema
        .createTable(tableName, callback);
}
exports.createTable = createTable;
function fetchTable(tableName, fields = ['*']) {
    return knexClient
        .select(...fields)
        .table(tableName);
}
exports.fetchTable = fetchTable;
function fetchAllOnCondition(tableName, objClause, returningFields = ['*']) {
    return knexClient
        .select(...returningFields)
        .table(tableName)
        .where(objClause);
}
exports.fetchAllOnCondition = fetchAllOnCondition;
function fetchFirstOnCondition(tableName, columnName, value, returningFields = ['*']) {
    return knexClient
        .select(...returningFields)
        .table(tableName)
        .where(columnName, value)
        .first();
}
exports.fetchFirstOnCondition = fetchFirstOnCondition;
function readFirstRow(table, column, value) {
    return knexClient(table)
        .where(column, value)
        .first();
}
exports.readFirstRow = readFirstRow;
function updateRow(tableName, column, value, newRow, returnings) {
    return knexClient(tableName)
        .where(column, value)
        .update(newRow, returnings);
}
exports.updateRow = updateRow;
function updateRowOnMultConditions(tableName, objClause, newRow, returnings) {
    return knexClient(tableName)
        .where(objClause)
        .update(newRow, returnings);
}
exports.updateRowOnMultConditions = updateRowOnMultConditions;
async function addRow(tableName, row, returnings) {
    if (await knexClient.schema.hasColumn(tableName, "uuid")) {
        Object.assign(row, row, { "uuid": uuid_1.v4() });
    }
    return knexClient(tableName).insert(row)
        .returning(returnings);
}
exports.addRow = addRow;
async function addRows(table, rows, returning, size) {
    if (await knexClient.schema.hasColumn(table, "uuid"))
        for (let row of rows)
            Object.assign(row, { "uuid": uuid_1.v4() });
    return knexClient.batchInsert(table, rows, size)
        .returning(returning);
}
exports.addRows = addRows;
function dropRows(table, objClause) {
    return knexClient(table)
        .where(objClause)
        .del();
}
exports.dropRows = dropRows;
