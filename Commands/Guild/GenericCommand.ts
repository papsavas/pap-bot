import {ApplicationCommandData, Message} from "discord.js";
import {commandType} from "../../Entities/Generic/commandType";
import {guildLoggerType} from "../../Entities/Generic/guildLoggerType";

export interface GenericCommand {
    execute(receivedMessage: Message,
            receivedCommand: commandType,
            addGuildLog: guildLoggerType
    ): Promise<any>;

    getGuide(): string;

    getKeyword(): string;

    getAliases(): string[];

    getCommandData(): ApplicationCommandData;

    matchAliases(possibleCommand: string): boolean;

}