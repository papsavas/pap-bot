import { ApplicationCommandData, Message, InteractionReplyOptions, Interaction, CommandInteraction } from "discord.js";
import { commandType } from "../../Entities/Generic/commandType";
import { guildLoggerType } from "../../Entities/Generic/guildLoggerType";

export interface GenericCommand {
    execute(receivedMessage: Message, receivedCommand: commandType): Promise<any>;

    getGuide(): string;

    getKeyword(): string;

    getAliases(): string[];

    getCommandData(): ApplicationCommandData;

    interactiveExecute(interaction: CommandInteraction): Promise<any>;

    matchAliases(possibleCommand: string): boolean;

}