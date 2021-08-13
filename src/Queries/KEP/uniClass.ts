import { deleteBatch, findAll, findOne, saveBatch } from "../../DB/GenericCRUD";
import { Teacher } from "../../Entities/KEP/Teacher";
import { uniClass } from "../../Entities/KEP/uniClass";

export function fetchUniClasses(returnings?: (keyof uniClass)[]) {
    return findAll('class', true, returnings) as Promise<uniClass[]>;
}

export function addUniClass(cl: uniClass) {
    return saveBatch('class', [cl]);
}

export async function linkTeacherToUniClass(teacherUsername: Teacher['username'], classCode: uniClass['code']) {
    const teacher = await findOne('teacher', { "username": teacherUsername }) as Teacher;
    const uniClass = await findOne('class', { "code": classCode }) as uniClass;
    return saveBatch('teacher_class', [{ "class_id": uniClass.uuid, "teacher_id": teacher.uuid }]);
}

export function deleteUniClass(code: uniClass['code']) {
    return findOne('class', { "code": code }, ['uuid']).then(async (uniClass) => {
        //!order matters, otherwise "teacher_class" will be violating foreign key constraint, fixed with cascade
        await deleteBatch('teacher_class', { "class_id": uniClass['uuid'] });
        await deleteBatch('class', { "uuid": uniClass['uuid'] });
    });
}