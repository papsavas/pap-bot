import { BaseCommandInteraction, Collection, InteractionReplyOptions, Message, ReplyMessageOptions, Snowflake } from "discord.js";
import { commandLiteral, CommandScope } from "../Entities/Generic/command";
import { GenericCommand } from "./GenericCommand";

export abstract class AbstractCommand implements GenericCommand {
    protected abstract _id: Collection<Snowflake, Snowflake>;
    protected abstract _keyword: string;
    protected abstract _guide: string;
    protected abstract _usage: string;
    protected abstract _type: CommandScope;

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

    abstract execute(receivedMessage: Message, receivedCommand: commandLiteral): Promise<unknown>;

    abstract interactiveExecute(interaction: BaseCommandInteraction): Promise<unknown>;

    abstract getAliases(): string[];

    respond = async (
        source: Message | BaseCommandInteraction,
        response: ReplyMessageOptions | InteractionReplyOptions
    ) =>
        source instanceof BaseCommandInteraction ?
            source.replied ?
                source.followUp(response) :
                source.deferred ?
                    source.editReply(response) :
                    source.reply(response) :
            source.reply(response)

    matchAliases(possibleCommand: string): boolean {
        return this.getAliases()
            .some((alias: string) => alias === possibleCommand?.toLowerCase());
    }

    /**
     * 
     * @param {string[]} aliases 
     * @param {string} keyword 
     * @returns {string[]} An array of aliases with the keyword included
     */
    protected mergeAliases(aliases: string[], keyword: string): string[] {
        return aliases.includes(keyword) ? aliases : [...aliases, keyword]
    }
}