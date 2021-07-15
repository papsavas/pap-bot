import { Collection } from "discord.js";
import { URL } from "node:url";
import { Class } from "./Class";

export interface Teacher {
    username: string,
    fullName: string,
    email: string,
    picture_url?: URL,
    website?: URL,
    classes: Collection<Class['role_id'], Class[]>
}