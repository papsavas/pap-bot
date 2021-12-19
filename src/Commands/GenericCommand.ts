import { BaseCommandInteraction, Collection, InteractionReplyOptions, Message, ReplyMessageOptions, Snowflake } from "discord.js";
import { commandLiteral, CommandScope } from "../Entities/Generic/command";
export interface GenericCommand {
    /**
     * The id of the command.
     * Key = id,
     * Value = guild_id
     */
    id: Collection<Snowflake, Snowflake>;
    keyword: string;
    guide: string;
    usage: string;
    type: CommandScope;
    interactiveExecute(commandInteraction: BaseCommandInteraction): Promise<unknown>;
    execute(receivedMessage: Message, receivedCommand: commandLiteral): Promise<unknown>;
    getAliases(): string[];
    matchAliases(possibleCommand: string | undefined): boolean;
    respond(source: Message, response: ReplyMessageOptions): Promise<unknown>;
    respond(source: BaseCommandInteraction, response: InteractionReplyOptions): Promise<unknown>;
}