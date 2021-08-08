import { Snowflake } from "discord.js";
import { deleteBatch, findAll, findOne, saveBatch } from "../../DB/GenericCRUD";
import { PendingStudent, Student } from "../../Entities/KEP/Student";
import { RequireAtLeastOne } from "../../tools/types";

export async function fetchStudent(
    clause: RequireAtLeastOne<Student, "am" | "email" | "member_id" | "uuid">,
    returnings?: (keyof Student)[]): Promise<Student> {
    return findOne('student', clause, returnings) as Promise<Student>;
}

export function fetchStudents(returnings?: (keyof Student)[]): Promise<Student[]> {
    return findAll('student', true, returnings) as Promise<Student[]>;
}

export function addStudents(students: Student[], returnings?: keyof Student): Promise<unknown> {
    return saveBatch("student", students, returnings);
}

export async function deleteStudents(clause: RequireAtLeastOne<Student, "am" | "email" | "member_id" | "uuid">): Promise<number> {
    return deleteBatch("student", clause);
}

export async function savePendingStudent(student: PendingStudent) {
    if (Boolean(await fetchPendingStudent(student.am)))
        await deleteBatch("pending_student", { am: student.am }); //replace previous record
    return saveBatch("pending_student", [student]);
}

export function fetchPendingStudent(member_id: Snowflake) {
    return findOne('pending_student', { member_id }) as Promise<PendingStudent>;
}

export function dropPendingStudent(member_id: Snowflake) {
    return deleteBatch("pending_student", { member_id });
}