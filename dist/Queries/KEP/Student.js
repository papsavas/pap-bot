"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dropStudent = exports.addStudent = exports.addStudents = exports.fetchStudentOnCondition = exports.fetchStudent = void 0;
const CoreRepo_1 = require("../../DB/CoreRepo");
async function fetchStudent(column, value) {
    return CoreRepo_1.readFirstRow('student', column, value);
}
exports.fetchStudent = fetchStudent;
async function fetchStudentOnCondition(column, value, returnings) {
    return CoreRepo_1.fetchFirstOnCondition('student', column, value, returnings);
}
exports.fetchStudentOnCondition = fetchStudentOnCondition;
function addStudents(students, returnings, size) {
    return CoreRepo_1.addRows('student', students, returnings, size);
}
exports.addStudents = addStudents;
async function addStudent(student, returnings) {
    return CoreRepo_1.addRow('student', student, returnings?.length > 0 ? returnings : undefined);
}
exports.addStudent = addStudent;
async function dropStudent(field, value) {
    return CoreRepo_1.dropRows('student', { [field]: value });
}
exports.dropStudent = dropStudent;
