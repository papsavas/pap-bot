import { Snowflake } from "discord.js";

type commandLiteral = {
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

interface CommandType {
    id: Snowflake;
    keyword: string;
    guide: string;
    guild_id?: Snowflake;
    aliases?: string[];
    global?: boolean;
    uuid?: string;
}


enum commandSpecifier {
    GUILD = "GUILD",
    GLOBAL = "GLOBAL"
}

export { commandLiteral, CommandType, commandSpecifier };
