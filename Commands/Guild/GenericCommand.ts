import Bundle from "../../BundlePackage/Bundle";
import {Message} from "discord.js";
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

    matchAliases(possibleCommand: string): boolean;

    logErrorOnBugsChannel(err: Error, bundle: Bundle): void;
}