import { courseTable, teacherTable, teacher_courseTable } from "../../../values/generic/DB.json";
import { deleteBatch, findOne, saveBatch } from "../../DB/GenericCRUD";
import { Teacher } from "../../Entities/KEP/Teacher";

export async function addTeacher(teacher: Teacher) {
    const { courses: teacherCourses, ...dbTeacher } = teacher;
    const [teacherID] = await saveBatch(teacherTable, [dbTeacher], 'uuid');
    const relation: { teacher_id: string, course_id: string }[] = [];
    for (const c of teacherCourses.values()) {
        const course = await findOne(courseTable, { "code": c.code }, ['uuid']);
        relation.push({ teacher_id: teacherID, course_id: course['uuid'] });
    }
    return saveBatch(teacher_courseTable, relation);
}

export function deleteTeacher(username: Teacher['username']) {
    return findOne(teacherTable, { "username": username }, ['uuid']).then(async (teacher) => {
        //!order matters, otherwise "teacher_class" will be violating foreign key constraint, fixed with cascade
        await deleteBatch(teacher_courseTable, { "teacher_id": teacher['uuid'] });
        await deleteBatch(teacherTable, { "uuid": teacher['uuid'] });
    });
}
