import {Snowflake} from "discord.js";

export type StudentType = {
    am: string;
    memberID: Snowflake;
    name: string | null;
    email: string;
}