import { deleteBatch, findOne, saveBatch } from "../../DB/GenericCRUD";
import { Teacher } from "../../Entities/KEP/Teacher";

export async function addTeacher(teacher: Teacher) {
    const { classes } = teacher;
    delete teacher.classes;
    const [teacherID] = await saveBatch('teacher', [teacher], 'uuid');
    const relation: { teacher_id: string, class_id: string }[] = [];
    for (const c of classes.values()) {
        const classObj = await findOne('class', { "code": c.code }, ['uuid']);
        relation.push({ teacher_id: teacherID, class_id: classObj['uuid'] });
    }
    return saveBatch('teacher_class', relation);
}

export function deleteTeacher(username: Teacher['username']) {
    return findOne('teacher', { "username": username }, ['uuid']).then(async (teacher) => {
        //!order matters, otherwise "teacher_class" will be violating foreign key constraint
        await deleteBatch('teacher_class', { "teacher_id": teacher['uuid'] });
        await deleteBatch('teacher', { "uuid": teacher['uuid'] });
    });
}
