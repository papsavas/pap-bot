import { courseTable, teacherTable, teacher_courseTable } from "../../../values/generic/DB.json";
import { deleteBatch, findAll, findOne, saveBatch } from "../../DB/GenericCRUD";
import { Teacher } from "../../Entities/KEP/Teacher";
import { RequireAtLeastOne } from "../../tools/types";


export const fetchTeachers = (
    clase?: RequireAtLeastOne<Teacher, "username" | "uuid" | "email">,
    returnings?: (keyof Teacher)[]
) =>
    findAll(teacherTable, clase ?? !clase, returnings) as Promise<Teacher[]>;


export async function addTeacher(teacher: Teacher) {
    const { courses: teacherCourses, ...dbTeacher } = teacher;
    const [teacherUUID] = await saveBatch(teacherTable, [dbTeacher], 'uuid');
    const relation: { teacher_id: string, course_id: string }[] = [];
    for (const c of teacherCourses.values()) {
        const course = await findOne(courseTable, { "code": c.code }, ['uuid']);
        relation.push({ teacher_id: teacherUUID, course_id: course['uuid'] });
    }
    return saveBatch(teacher_courseTable, relation);
}

export async function deleteTeacher(username: Teacher['username']) {
    const teacher = await findOne(teacherTable, { "username": username }, ['uuid']);
    //!order matters, otherwise "teacher_class" will be violating foreign key constraint, fixed with cascade
    await deleteBatch(teacher_courseTable, { "teacher_id": teacher['uuid'] });
    await deleteBatch(teacherTable, { "uuid": teacher['uuid'] });
}
