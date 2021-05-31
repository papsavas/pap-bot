
import "reflect-metadata";
import { ApplicationCommandData, CommandInteraction, Guild, Message, MessageEmbed, Snowflake } from 'discord.js';
import { bugsChannel } from '../../index';
import { literalCommandType } from "../../Entities/Generic/commandType";
import { guildLoggerType } from "../../Entities/Generic/guildLoggerType";
import GenericGlobalCommand from "./GenericGlobalCommand";

export abstract class AbstractGlobalCommand implements GenericGlobalCommand {
    abstract readonly id: Snowflake | undefined;
    abstract getCommandData(): ApplicationCommandData;

    abstract execute(receivedMessage: Message, receivedCommand: literalCommandType): Promise<any>;

    abstract interactiveExecute(interaction: CommandInteraction): Promise<any>;

    abstract getKeyword(): string;

    abstract getAliases(): string[];

    abstract getGuide(): string;

    abstract addGuildLog(guildID: Snowflake, log: string): string | void

    matchAliases(possibleCommand: string): boolean {
        return !!this.getAliases()
            .find((alias: string) => alias === possibleCommand.toLowerCase());
    }

    logErrorOnBugsChannel(err: Error, guild: Guild, primaryCommandLiteral: string) {
        const emb = new MessageEmbed({
            author: {
                name: guild.name,
                icon_url: "https://icon-library.com/images/error-icon-transparent/error-icon-transparent-13.jpg"
            },
            thumbnail: {
                proxy_url: guild.iconURL({ format: "png", size: 512 })
            },
            title: primaryCommandLiteral,
            color: "DARK_RED",
            timestamp: new Date()

        })
        emb.setDescription(`\`\`\`${err}\`\`\``)
        bugsChannel.send(emb).catch(internalErr => console.log(internalErr));
    }

    protected addKeywordToAliases(aliases: string[], keyword: string): string[] {
        return aliases.includes(keyword)
            ? [...aliases, keyword]
            : aliases
    }
}