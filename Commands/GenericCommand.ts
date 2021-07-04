import { CommandInteraction, Message, Snowflake } from "discord.js";
import { commandSpecifier, literalCommandType } from "../Entities/Generic/commandType";
export interface GenericCommand {
    id: Snowflake;
    keyword: string;
    guide: string;
    usage: string;
    type: commandSpecifier;

    interactiveExecute(commandInteraction: CommandInteraction): Promise<unknown>;

    execute(receivedMessage: Message, receivedCommand: literalCommandType): Promise<unknown>;

    getAliases(): string[];

    matchAliases(possibleCommand: string | undefined): boolean;

}