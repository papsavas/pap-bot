import { CommandInteraction, Message, Snowflake } from "discord.js";
import { literalCommandType } from "../Entities/Generic/commandType";

export interface GenericCommand {
    id: Snowflake;
    keyword: string;
    guide: string;
    usage: string;

    interactiveExecute(commandInteraction: CommandInteraction): Promise<unknown>;

    execute(receivedMessage: Message, receivedCommand: literalCommandType): Promise<unknown>;

    getAliases(): string[];

    matchAliases(possibleCommand: string): boolean;

}