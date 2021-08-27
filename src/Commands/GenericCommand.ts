import { Collection, CommandInteraction, Message, Snowflake } from "discord.js";
import { commandLiteral, commandSpecifier } from "../Entities/Generic/command";
export interface GenericCommand {
    id: Collection<Snowflake, Snowflake>;
    keyword: string;
    guide: string;
    usage: string;
    type: commandSpecifier;

    interactiveExecute(commandInteraction: CommandInteraction): Promise<unknown>;

    execute(receivedMessage: Message, receivedCommand: commandLiteral): Promise<unknown>;

    getAliases(): string[];

    matchAliases(possibleCommand: string | undefined): boolean;

}