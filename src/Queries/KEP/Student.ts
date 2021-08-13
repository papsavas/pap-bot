import { Collection, Snowflake } from "discord.js";
import { courseTable, pendingStudentTable, studentTable, student_courseTable } from "../../../values/generic/DB.json";
import { deleteBatch, findAll, findOne, saveBatch } from "../../DB/GenericCRUD";
import { Course } from "../../Entities/KEP/Course";
import { PendingStudent, Student } from "../../Entities/KEP/Student";
import { RequireAtLeastOne } from "../../tools/types";

export async function fetchStudent(
    clause: RequireAtLeastOne<Student, "am" | "email" | "member_id" | "uuid">,
    returnings?: (keyof Student)[]): Promise<Student> {
    return findOne(studentTable, clause, returnings) as Promise<Student>;
}


export async function fetchStudents(returnings?: (keyof Student)[]): Promise<Collection<Snowflake, Student>> {
    const students = await findAll(studentTable, true, returnings) as Student[];
    const collection = new Collection<Snowflake, Student>();
    for (const student of students) {
        student.courses = new Collection<Snowflake, Course>();
        //TODO: use JOIN
        const coursesUUID = (await findAll(student_courseTable, { "student_id": student.uuid }, ["course_id"]))
            .map(c => c["course_id"]) as string[];
        for (const course_id of coursesUUID) {
            const course = await findOne(courseTable, { "uuid": course_id }) as Course;
            if (course)
                student.courses.set(course.role_id, course);
        }
        collection.set(student.member_id, student);
    }
    return collection;
}

export function addStudents(students: Student[], returnings?: keyof Student): Promise<unknown> {
    return saveBatch(studentTable, students, returnings);
}

export async function deleteStudents(clause: RequireAtLeastOne<Student, "am" | "email" | "member_id" | "uuid">): Promise<number> {
    return deleteBatch(studentTable, clause);
}

export async function savePendingStudent(student: PendingStudent) {
    if (Boolean(await fetchPendingStudent(student.am)))
        await deleteBatch(pendingStudentTable, { am: student.am }); //replace previous record
    return saveBatch(pendingStudentTable, [student]);
}

export function fetchPendingStudent(member_id: Snowflake) {
    return findOne(pendingStudentTable, { member_id }) as Promise<PendingStudent>;
}

export function dropPendingStudent(member_id: Snowflake) {
    return deleteBatch(pendingStudentTable, { member_id });
}