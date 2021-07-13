import { addRow, addRows, dropRows, fetchFirstOnCondition, readFirstRow } from "../../../DB/CoreRepo";
import { Snowflake } from "discord.js";
import { amType, Student } from "../../Entities/KEP/Student";

export async function fetchStudent(column: keyof Student, value: Student[keyof Student]): Promise<Student> {
    return readFirstRow('student', column, value as string);
}

export async function fetchStudentOnCondition(column: keyof Student, value: Student[keyof Student], returnings?: string[]): Promise<{}> {
    return fetchFirstOnCondition('student', { [column]: value }, returnings);

}

export function addStudents(students: Student[], returnings?: keyof Student, size?: number): Promise<any> {
    return addRows('student', students, returnings, size)
}

export async function addStudent(student: Student, returnings?: (keyof Student)[]): Promise<any> {
    return addRow('student',
        student,
        returnings?.length > 0 ? returnings : undefined
    )
}

export async function dropStudent(data: { field: "am" | "member_id" | "email", value: amType | Snowflake | `${amType}@uom.edu.gr` }): Promise<number> {
    return dropRows('student', data)
}