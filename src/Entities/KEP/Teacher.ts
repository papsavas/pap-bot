import { Collection } from "discord.js";
import { Course } from "./Course";

export interface Teacher {
    username: string,
    full_name: string,
    email: string,
    courses: Collection<Course['role_id'], Course>,
    phone_number: `${number}`,
    picture_url?: string,
    website?: string
    uuid?: string
}