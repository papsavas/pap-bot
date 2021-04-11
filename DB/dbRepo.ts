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
    }
});

export function returnTable(tableName: string, fields = ['*']) { //returns object, not custom type
    return Knex.select(...fields).table(tableName);
}




