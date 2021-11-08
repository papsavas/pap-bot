import { BaseCommandInteraction, Collection, CommandInteraction, ContextMenuInteraction, InteractionReplyOptions, Message, ReplyMessageOptions, Snowflake } from "discord.js";
import { commandLiteral, commandSpecifier } from "../Entities/Generic/command";
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
    type: commandSpecifier;

    interactiveExecute(commandInteraction: CommandInteraction | ContextMenuInteraction): Promise<unknown>;

    execute(receivedMessage: Message, receivedCommand: commandLiteral): Promise<unknown>;

    getAliases(): string[];

    matchAliases(possibleCommand: string | undefined): boolean;

    respond(source: Message, response: ReplyMessageOptions): Promise<void>;
    respond(source: BaseCommandInteraction, response: InteractionReplyOptions): Promise<void>;

}