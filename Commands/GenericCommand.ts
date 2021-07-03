import { CommandInteraction, Message, Snowflake } from "discord.js";
import { literalCommandType } from "../Entities/Generic/commandType";
import GenericDMCommand from "./DM/GenericDMCommand";
import GenericGlobalCommand from "./Global/GenericGlobalCommand";
import GenericGuildCommand from "./Guild/GenericGuildCommand";

export interface GenericCommand {
    id: Snowflake;
    keyword: string;
    guide: string;
    usage: string;

    interactiveExecute(commandInteraction: CommandInteraction): Promise<unknown>;

    execute(receivedMessage: Message, receivedCommand: literalCommandType): Promise<unknown>;

    getAliases(): string[];

    matchAliases(possibleCommand: string | undefined): boolean;

    isGuildCommand(): this is GenericGuildCommand;

    isDMCommand(): this is GenericDMCommand;

    isGlobalCommand(): this is GenericGlobalCommand;

}