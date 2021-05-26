import { ApplicationCommandData, Message, InteractionReplyOptions, Interaction, CommandInteraction } from "discord.js";
import { literalCommandType } from "../../Entities/Generic/commandType";
import { guildLoggerType } from "../../Entities/Generic/guildLoggerType";

export interface GenericCommand {
    execute(receivedMessage: Message, receivedCommand: literalCommandType): Promise<any>;

    getGuide(): string;

    getKeyword(): string;

    getAliases(): string[];

    getCommandData(): ApplicationCommandData;

    interactiveExecute(interaction: CommandInteraction): Promise<any>;

    matchAliases(possibleCommand: string): boolean;

}