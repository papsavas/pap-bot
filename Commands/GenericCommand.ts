import { CommandInteraction, Message, Snowflake } from "discord.js";
import { literalCommandType } from "../Entities/Generic/commandType";

export interface GenericCommand {
    id: Snowflake;

    //init(): Promise<GenericCommand>;

    execute(receivedMessage: Message, receivedCommand: literalCommandType): Promise<any>;

    getGuide(): string;

    getKeyword(): string;

    getAliases(): string[];

    interactiveExecute(commandInteraction: CommandInteraction): Promise<any>;

    matchAliases(possibleCommand: string): boolean;

}