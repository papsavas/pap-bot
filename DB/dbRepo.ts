import knex from "knex";
import {studentType} from "../Entities/KEP/Student";

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


export function addStudents(rows: studentType[], size?: number): Promise<any> {
    return Knex.batchInsert('student', rows, size)
        .returning('am')
}

export async function addStudent(student: studentType): Promise<any>{
    return Knex('student').insert(
        {
            "am":student.am,
            "member_id": student.member_id,
            "email": student.email,
            "name": student.name
        }, ['am', 'member_id']
    )
}