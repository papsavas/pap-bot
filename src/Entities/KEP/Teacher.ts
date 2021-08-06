import { Collection } from "discord.js";
import { URL } from "url";
import { uniClass } from "./uniClass";

export interface Teacher {
    username: string,
    full_name: string,
    email: string,
    classes: Collection<uniClass['role_id'], uniClass>,
    phone_number: `${number}`,
    picture_url?: URL,
    website?: URL
    uuid?: string
}