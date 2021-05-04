
import { GenericCommand } from "./GenericCommand";
import "reflect-metadata";
import * as Discord from 'discord.js';
import { Message } from 'discord.js';
import { bugsChannel } from '../../index';
import { commandType } from "../../Entities/Generic/commandType";
import { guildLoggerType } from "../../Entities/Generic/guildLoggerType";

export abstract class AbstractCommand implements GenericCommand {
    abstract getCommandData(): Discord.ApplicationCommandData;

    abstract execute(receivedMessage: Message, receivedCommand: commandType, addGuildLog: guildLoggerType): Promise<any>;

    abstract interactiveExecute(interaction: Discord.CommandInteraction): Promise<any>;

    abstract getKeyword(): string;

    abstract getAliases(): string[];

    abstract getGuide(): string;

    matchAliases(possibleCommand: string): boolean {
        return !!this.getAliases()
            .find((alias: string) => alias === possibleCommand.toLowerCase());
    }

    logErrorOnBugsChannel(err: Error, guild: Discord.Guild, primaryCommandLiteral: string) {
        const emb = new Discord.MessageEmbed({
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