import {Collection, Snowflake} from "discord.js";
import {classType} from "./Class";
import {addRow, addRows, dropRow, fetchFirstOnCondition, readFirstRow} from "../../DB/dbRepo";

type digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type digitZeroLess = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type tmType = `tm${1}${digitZeroLess}${digit}${digit | ''}${digit | ''}`;
type itType = `'it${0 | 1}${digit}${digit}${digit | ''}${digit | ''}`;
type daiType = `dai${1}${6 | 7 | 8 | 9}${0 | 1 | 2 | 3}${digit}${digit}`;
type icsType = `ics${2}${digitZeroLess}${digit}${digit}${digit}`;
type iisType = `iis${2}${digitZeroLess}${digit}${digit}${digit}`;
export type amType = tmType | itType | daiType | icsType | iisType;

export type studentType = {
    am: amType;
    email: `${amType}@uom.edu.gr`;
    member_id: Snowflake,
    name?: string | null;
    classes?: Collection<classType['role_id'], classType[]>
    uuid?: string
}

export type studentFineType = {
    student_id: amType;
    channel_id?: Snowflake;
    reason: string;
    uuid?: string;
}

export async function fetchStudent(column: keyof studentType, value: studentType[keyof studentType]): Promise<studentType> {
    return readFirstRow('student', column, value as string);
}

export async function fetchStudentOnCondition(column: keyof studentType, value: studentType[keyof studentType], returnings?: string[]): Promise<{}> {
    const res = await fetchFirstOnCondition('student', column, value, returnings);
    if (res.length == 0)
        return Promise.reject(`student with "${column} : ${value}" not found`);
    else if (res.length > 1)
        return Promise.reject(`found duplicate student with ${column} : ${value}`);
    else return Promise.resolve(res[0])
}

export function addStudents(students: studentType[], returnings?: keyof studentType, size?: number): Promise<any> {
    return addRows('student', students, returnings, size)
}

export async function addStudent(student: studentType, returnings?: (keyof studentType)[]): Promise<any> {
    return addRow('student',
        student,
        returnings?.length > 0 ? returnings : undefined
    )
}

export async function dropStudent(field: "am" | "member_id" | "email", value: amType | Snowflake): Promise<number> {
    return dropRow('student', field, value)
}

