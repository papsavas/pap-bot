import { Snowflake } from "discord.js";
import { URL } from "node:url";

export { semesterRegex, Course, CourseEvent };

type dayType = 1 | 2 | 3 | 4 | 5;
type timeType = 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21;
type semesterType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;  //9 για άλλα τμήματα

const semesterRegex = /^(1|2|3|4|5|6|7|8|9)$/;
interface Course {
    code: string;
    name: string;
    semester: `${semesterType}` | semesterType;
    channel_id: Snowflake;
    role_id: Snowflake;
    repo_link?: URL;
    day?: `${dayType}` | dayType;
    time?: `${timeType}` | timeType;
    video_conference_link?: URL;
    drive_link?: string;
    uuid?: string;
}

interface CourseEvent {
    title: string;
    code: Course['code'];
    start: Date;
    end: Date;
    info?: string;
    location?: string;
    recurring?: {
        recurrence: "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
        count: number;
    }
}