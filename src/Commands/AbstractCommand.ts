import { Collection, CommandInteraction, ContextMenuInteraction, Message, Snowflake } from "discord.js";
import { commandLiteral, commandSpecifier } from "../Entities/Generic/command";
import { GenericCommand } from "./GenericCommand";

export abstract class AbstractCommand implements GenericCommand {
    protected abstract _id: Collection<Snowflake, Snowflake>;
    protected abstract _keyword: string;
    protected abstract _guide: string;
    protected abstract _usage: string;
    protected abstract _type: commandSpecifier;

    get type() {
        return this._type;
    }


    get id() {
        return this._id;
    }

    set id(id) {
        this._id = id;
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

    abstract execute(receivedMessage: Message, receivedCommand: commandLiteral): Promise<unknown>;

    abstract interactiveExecute(interaction: CommandInteraction | ContextMenuInteraction): Promise<unknown>;

    abstract getAliases(): string[];


    matchAliases(possibleCommand: string): boolean {
        return this.getAliases()
            .some((alias: string) => alias === possibleCommand?.toLowerCase());
    }

    protected addKeywordToAliases(aliases: string[], keyword: string): string[] {
        return aliases.includes(keyword) ? aliases : [...aliases, keyword]
    }
}