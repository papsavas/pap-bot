import { Snowflake } from "discord.js";

export {
    commandLiteral,
    CommandOptions,
    CommandScope,
    ToArgxType,
    ToArgsxType,
    ArgDigits,
    argDigits
};

const argDigits = <const>[1, 2, 3, 4];
type ArgDigits = typeof argDigits[number];
type Argx = `arg${ArgDigits}`;
type Argsx = `args${ArgDigits}`;
type ArgxType = Record<Argx, string>;
type ArgsxType = Record<Argsx, string>;
type ToArgxType<T> = {
    [K in keyof T as Argx]: string;
}
type ToArgsxType<T> = {
    [K in keyof T as Argsx]: string;
}

type commandLiteral = ArgxType & ArgsxType & {
    fullCommand: string;
    splitCommand: string[];
    primaryCommand: string;
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

