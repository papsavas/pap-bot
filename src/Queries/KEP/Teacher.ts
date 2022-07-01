import * as dbLiterals from '../../../values/generic/DB.json' assert { type: 'json' };
import { deleteBatch, findAll, findOne, saveBatch } from "../../DB/GenericCRUD";
import { Teacher } from "../../Entities/KEP/Teacher";
import { RequireAtLeastOne } from "../../tools/types";
const {
    courseTable, teacherTable, teacher_courseTable
} = dbLiterals;

export { fetchTeachers, addTeacher, deleteTeacher };

const fetchTeachers = (
    clause?: RequireAtLeastOne<Teacher>,
    returnings?: (keyof Teacher)[]
) =>
    findAll(teacherTable, clause ?? !clause, returnings) as Promise<Teacher[]>;


async function addTeacher(teacher: Teacher) {
    const { courses: teacherCourses, ...dbTeacher } = teacher;
    const [teacherUUID] = await saveBatch(teacherTable, [dbTeacher], 'uuid');
    const relation: { teacher_id: string, course_id: string }[] = [];
    if (!!teacherCourses) {
        for (const c of teacherCourses.values()) {
            const course = await findOne(courseTable, { "code": c.code }, ['uuid']);
            relation.push({ teacher_id: teacherUUID, course_id: course['uuid'] });
        }
        await saveBatch(teacher_courseTable, relation);
    }
}

async function deleteTeacher(username: Teacher['username']) {
    const teacher = await findOne(teacherTable, { "username": username }, ['uuid']);
    //!order matters, otherwise "teacher_class" will be violating foreign key constraint, fixed with cascade
    await deleteBatch(teacher_courseTable, { "teacher_id": teacher['uuid'] });
    await deleteBatch(teacherTable, { "uuid": teacher['uuid'] });
}


