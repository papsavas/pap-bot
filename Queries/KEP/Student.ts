import {addRow, addRows, dropRows, fetchFirstOnCondition, readFirstRow} from "../../DB/dbRepo";
import {Snowflake} from "discord.js";
import {amType, studentType} from "../../Entities/KEP/Student";

export async function fetchStudent(column: keyof studentType, value: studentType[keyof studentType]): Promise<studentType> {
    return readFirstRow('student', column, value as string);
}

export async function fetchStudentOnCondition(column: keyof studentType, value: studentType[keyof studentType], returnings?: string[]): Promise<{}> {
    return fetchFirstOnCondition('student', column, value, returnings);

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
    return dropRows('student', field, value)
}