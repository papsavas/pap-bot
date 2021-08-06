import { deleteBatch, findAll, findOne, saveBatch } from "../../DB/GenericCRUD";
import { Student } from "../../Entities/KEP/Student";
import { RequireAtLeastOne } from "../../toolbox/types";

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

