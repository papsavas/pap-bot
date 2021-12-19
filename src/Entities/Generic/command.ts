import { Snowflake } from "discord.js";

interface commandLiteral {
    fullCommand: string;
    splitCommand: string[];
    primaryCommand: string;
    arg1?: string;
    arg2?: string;
    arg3?: string;
    commandless1?: string;
    commandless2?: string;
    commandless3?: string;
}

interface CommandOptions {
    id: Snowflake;
    keyword: string;
    guide: string;
    guild_id?: Snowflake;
    aliases?: string[];
    global?: boolean;
    uuid?: string;
}


enum CommandScope {
    GUILD = "GUILD",
    GLOBAL = "GLOBAL"
}

export { commandLiteral, CommandOptions, CommandScope };

