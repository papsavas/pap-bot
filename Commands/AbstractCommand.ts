import { CommandInteraction, Message, Snowflake } from "discord.js";
import { literalCommandType } from "../Entities/Generic/commandType";
import { AbstractDMCommand } from "./DM/AbstractDMCommand";
import GenericDMCommand from "./DM/GenericDMCommand";
import { GenericCommand } from "./GenericCommand";
import { AbstractGlobalCommand } from "./Global/AbstractGlobalCommand";
import GenericGlobalCommand from "./Global/GenericGlobalCommand";
import { AbstractGuildCommand } from "./Guild/AbstractGuildCommand";
import GenericGuildCommand from "./Guild/GenericGuildCommand";


export abstract class AbstractCommand implements GenericCommand {
    protected abstract _id: Snowflake;
    protected abstract _keyword: string;
    protected abstract _guide: string;
    protected abstract _usage: string;

    get id() {
        return this._id;
    }

    get keyword() {
        return this._keyword;
    }

    get guide() {
        return this._guide;
    }

    get usage() {
        return this._usage;
    }


    static init() { }

    abstract execute(receivedMessage: Message, receivedCommand: literalCommandType): Promise<unknown>;

    abstract interactiveExecute(commandInteraction: CommandInteraction): Promise<unknown>;

    abstract getAliases(): string[];


    matchAliases(possibleCommand: string): boolean {
        return this.getAliases()
            .some((alias: string) => alias === possibleCommand?.toLowerCase());
    }

    protected addKeywordToAliases(aliases: string[], keyword: string): string[] {
        return aliases.includes(keyword)
            ? [...aliases, keyword]
            : aliases
    }


    isGuildCommand(): this is GenericGuildCommand {
        return this instanceof AbstractGuildCommand
    }

    isDMCommand(): this is GenericDMCommand {
        return this instanceof AbstractDMCommand
    }

    isGlobalCommand(): this is GenericGlobalCommand {
        return this instanceof AbstractGlobalCommand
    }
}