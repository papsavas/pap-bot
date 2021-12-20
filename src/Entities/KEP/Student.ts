import { Collection, Snowflake } from "discord.js";
import { Course } from "./Course";

export { amType, Student, PendingStudent, StudentFine };

type digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type digitZeroLess = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type tmType = `tm${1}${digitZeroLess}${digit}${digit | ''}${digit | ''}`;
type itType = `'it${0 | 1}${digit}${digit}${digit | ''}${digit | ''}`;
type daiType = `dai${1}${6 | 7 | 8 | 9}${0 | 1 | 2 | 3}${digit}${digit}`;
type icsType = `ics${2}${digitZeroLess}${digit}${digit}${digit}`;
type iisType = `iis${2}${digitZeroLess}${digit}${digit}${digit}`;
type amType = tmType | itType | daiType | icsType | iisType;

interface Student {
    am: amType;
    email: `${amType}@uom.edu.gr`;
    member_id: Snowflake,
    blocked?: boolean,
    courses?: Collection<Course['role_id'], Course>
    uuid?: string
}

type PendingStudent = Omit<Student, "courses" | "uuid" | "blocked"> & { password: number, date?: Date };

interface StudentFine {
    student_id: amType;
    channel_id?: Snowflake;
    reason: string;
    uuid?: string;
}


