import { Collection, Snowflake } from "discord.js";
import { deleteBatch, findAll, findOne, saveBatch } from "../../DB/GenericCRUD";
import { PendingStudent, Student } from "../../Entities/KEP/Student";
import { uniClass } from "../../Entities/KEP/uniClass";
import { RequireAtLeastOne } from "../../tools/types";

export async function fetchStudent(
    clause: RequireAtLeastOne<Student, "am" | "email" | "member_id" | "uuid">,
    returnings?: (keyof Student)[]): Promise<Student> {
    return findOne('student', clause, returnings) as Promise<Student>;
}


export async function fetchStudents(returnings?: (keyof Student)[]): Promise<Student[]> {
    const students = await findAll('student', true, returnings) as Student[];
    for (const student of students) {
        student.classes = new Collection<Snowflake, uniClass>();
        //TODO: use JOIN
        const classesUUID = (await findAll('student_class', { "student_id": student.uuid }, ["class_id"]))
            .map(c => c["class_id"]) as string[];
        for (const class_id of classesUUID) {
            const uniClass = await findOne('class', { "uuid": class_id }) as uniClass;
            if (uniClass)
                student.classes.set(uniClass.role_id, uniClass);
        }
    }
    return students;
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