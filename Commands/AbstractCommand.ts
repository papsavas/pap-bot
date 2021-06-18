import { CommandInteraction, Message, Snowflake } from "discord.js";
import { literalCommandType } from "../Entities/Generic/commandType";
import { GenericCommand } from "./GenericCommand";


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

    abstract execute(receivedMessage: Message, receivedCommand: literalCommandType): Promise<any>;

    abstract interactiveExecute(commandInteraction: CommandInteraction): Promise<any>;

    abstract getAliases(): string[];


    matchAliases(possibleCommand: string): boolean {
        return !!this.getAliases()
            .find((alias: string) => alias === possibleCommand.toLowerCase());
    }

    protected addKeywordToAliases(aliases: string[], keyword: string): string[] {
        return aliases.includes(keyword)
            ? [...aliases, keyword]
            : aliases
    }
}