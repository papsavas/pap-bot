import { Snowflake } from "discord.js";

export type commandLiteral = {
    //prefix: string;
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

export interface CommandType {
    id: Snowflake;
    keyword: string;
    guide: string;
    guild_id?: Snowflake;
    aliases?: string[];
    global?: boolean;
    uuid?: string;
}


export enum commandSpecifier {
    GUILD = "GUILD",
    GLOBAL = "GLOBAL"
}
