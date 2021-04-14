import {Snowflake} from "discord.js";

export type commandType = {
    prefix: string;
    fullCommand: string;
    splitCommand: string[];
    primaryCommand: string;
    arg1: string | undefined;
    arg2: string | undefined;
    arg3: string | undefined;
    commandless1: string | undefined;
    commandless2: string | undefined;
    commandless3: string | undefined;
}

export type guildLoggerType = (log: string) => string

export type ResponsesType = {
    user: Snowflake,
    responses: string[]
}

export type StudentType = {
    am: string;
    memberID: Snowflake;
    name: string | null;
    email: string;
}


