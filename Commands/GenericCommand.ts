import Bundle from "../BundlePackage/Bundle";
import {Message} from "discord.js";
import {commandType, guildLoggerType} from "../Entities";

export interface GenericCommand {
    execute(receivedMessage: Message,
            receivedCommand: commandType,
            addGuildLog: guildLoggerType
    ): Promise<any>;

    getGuide(): string;

    getKeyword(): string;

    getAliases(): string[];

    matchAliases(possibleCommand: string): boolean;

    logErrorOnBugsChannel(err: Error, bundle: Bundle): void;
}