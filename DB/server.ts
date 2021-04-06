import {Client} from "pg";

export const client = new Client({
    user: "postgres",
    password: process.env.DB_PSWD,
    host: "localhost",
    port: parseInt(process.env.DB_PORT),
    database: "test"
});

export function logToDB() {
    client.connect()
        .then(() => console.log('Logged in to DB'))
        .catch(err => console.error(err))
        .finally(() => client.end())
}


