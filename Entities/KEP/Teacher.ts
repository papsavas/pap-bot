import {classType} from "./Class";
import {Collection} from "discord.js";

export type teacherType = {
    username: string,
    fullName: string,
    email: string,
    picture_url?: URL,
    website?: URL,
    classes: Collection<classType['role_id'],classType[]>
}