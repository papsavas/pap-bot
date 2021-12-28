import { BaseCommandInteraction, Collection, InteractionReplyOptions, Message, ReplyMessageOptions, Snowflake } from "discord.js";
import { commandLiteral, CommandScope } from "../Entities/Generic/command";
export interface GenericCommand {
    /**
     * The id of the command.
     * Key = id,
     * Value = guild_id
     */
    readonly id: Collection<Snowflake, Snowflake>;
    readonly aliases: string[];
    readonly keyword: string;
    readonly guide: string;
    readonly usage: string;
    readonly type: CommandScope;
    interactiveExecute(commandInteraction: BaseCommandInteraction): Promise<unknown>;
    execute(receivedMessage: Message, receivedCommand: commandLiteral): Promise<unknown>;
    matchAliases(possibleCommand: string | undefined): boolean;
    respond(source: Message, response: ReplyMessageOptions): Promise<unknown>;
    respond(source: BaseCommandInteraction, response: InteractionReplyOptions): Promise<unknown>;
}