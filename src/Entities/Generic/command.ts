import { Snowflake } from "discord.js";

const argDigits = [1, 2, 3, 4] as const;
type ArgDigits = typeof argDigits[number];
type Arg = `arg${ArgDigits}`;
type Args = `args${ArgDigits}`;
type ArgType = Record<Arg, string>
type ArgsType = Record<Args, string>
type ToArgType<T> = {
    [K in keyof T as Arg]: string
}
type ToArgsType<T> = {
    [K in keyof T as Args]: string
}

type commandLiteral = ArgType & ArgsType & {
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

export { commandLiteral, CommandOptions, CommandScope, ToArgType, ToArgsType, ArgDigits, argDigits };

