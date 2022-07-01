import * as dbLiterals from '../../../values/generic/DB.json';
import { deleteBatch, findAll, findOne, saveBatch, updateAll } from "../../DB/GenericCRUD";
import { Course } from "../../Entities/KEP/Course";
import { Teacher } from "../../Entities/KEP/Teacher";
import { RequireAtLeastOne } from "../../tools/types";
const {
    courseTable, teacherTable, teacher_courseTable
} = dbLiterals;


function fetchCourses(
    clause?: RequireAtLeastOne<Course>,
    returnings?: (keyof Course)[]
) {
    return findAll(courseTable, clause ?? !clause, returnings) as Promise<Course[]>;
}

function addCourse(c: Course) {
    return saveBatch(courseTable, [c]);
}

function updateCourse(c: Course) {
    return updateAll(courseTable, { "code": c.code }, c);
}

async function linkTeacherToCourse(courseCode: Course['code'], teacherUsername: Teacher['username']) {
    const teacher = await findOne(teacherTable, { "username": teacherUsername }) as Teacher;
    const courses = await fetchCourses();
    const course = courses.find(c => c.code.includes(courseCode)); //TODO: solve dual course codes
    if (Boolean(teacher && course))
        return saveBatch(teacher_courseTable, [{ "course_id": course.uuid, "teacher_id": teacher.uuid }]);
    else
        return `${teacher ? '' : teacherUsername} ${course ? '' : courseCode} not found`;
}

async function unlinkTeacherFromCourse(courseCode: Course['code'], teacherUsername: Teacher['username']) {
    const teacher = await findOne(teacherTable, { "username": teacherUsername }) as Teacher;
    const course = await findOne(courseTable, { "code": courseCode }) as Course;
    return deleteBatch(teacher_courseTable, { "course_id": course.uuid, "teacher_id": teacher.uuid });
}

//TODO: replace with fetching table
const fetchTeacherCourses = () =>
    findAll(teacher_courseTable, true) as Promise<{
        course_id: Course['uuid'],
        teacher_id: Teacher['uuid']
    }[]>;

function dropCourse(code: Course['code']) {
    return findOne(courseTable, { "code": code }, ['uuid']).then(async (course) => {
        //!order matters, otherwise "teacher_class" will be violating foreign key constraint, fixed with cascade
        await deleteBatch(teacher_courseTable, { "course_id": course['uuid'] });
        await deleteBatch(courseTable, { "uuid": course['uuid'] });
    });
}

export { fetchCourses, addCourse, updateCourse, linkTeacherToCourse, unlinkTeacherFromCourse, fetchTeacherCourses, dropCourse };

