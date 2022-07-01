import { Collection, Snowflake } from "discord.js";
import * as dbLiterals from '../../../values/generic/DB.json';
import { deleteBatch, findAll, findOne, saveBatch, updateAll } from "../../DB/GenericCRUD";
import { Course } from "../../Entities/KEP/Course";
import { PendingStudent, Student } from "../../Entities/KEP/Student";
import { RequireAtLeastOne } from "../../tools/types";
const { pendingStudentTable, studentTable } = dbLiterals;

async function fetchStudent(
    clause: RequireAtLeastOne<Student>,
    returnings?: (keyof Student)[]): Promise<Student> {
    return findOne(studentTable, clause, returnings) as Promise<Student>;
}


async function fetchStudents(returnings?: (keyof Student)[]): Promise<Collection<Snowflake, Student>> {
    const students = await findAll(studentTable, true, returnings) as Student[];
    const collection = new Collection<Snowflake, Student>();
    for (const student of students) {
        student.courses = new Collection<Snowflake, Course>();
        //? avoided, limited rows on free plan
        /*
        const coursesUUID = (await findAll(student_courseTable, { "student_id": student.uuid }, ["course_id"]))
            .map(c => c["course_id"]) as string[];
        for (const course_id of coursesUUID) {
            const course = await findOne(courseTable, { "uuid": course_id }) as Course;
            if (course)
                student.courses.set(course.role_id, course);
        }
        */
        collection.set(student.member_id, student);
    }
    return collection;
}

function addStudents(students: Student[], returnings?: keyof Student): Promise<unknown> {
    return saveBatch(studentTable, students, returnings);
}

async function dropStudents(clause: RequireAtLeastOne<Student>): Promise<number> {
    return deleteBatch(studentTable, clause);
}

async function savePendingStudent(student: PendingStudent) {
    if (Boolean(await fetchPendingStudent(student.am)))
        await deleteBatch(pendingStudentTable, { am: student.am }); //replace previous record
    return saveBatch(pendingStudentTable, [student]);
}

function fetchPendingStudent(member_id: Snowflake) {
    return findOne(pendingStudentTable, { member_id }) as Promise<PendingStudent>;
}

function dropPendingStudent(member_id: Snowflake) {
    return deleteBatch(pendingStudentTable, { member_id });
}

const dropAllPendingStudents = () => deleteBatch(pendingStudentTable, true);

const banStudent = (member_id: Snowflake) =>
    updateAll(studentTable, { member_id }, { "blocked": true });

const unbanStudent = (member_id: Snowflake) =>
    updateAll(studentTable, { member_id }, { "blocked": false });

export {
    fetchStudent,
    fetchStudents,
    addStudents,
    dropStudents,
    savePendingStudent,
    fetchPendingStudent,
    dropPendingStudent,
    dropAllPendingStudents,
    banStudent,
    unbanStudent
};

