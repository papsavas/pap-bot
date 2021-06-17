
import "reflect-metadata";
import { ApplicationCommandData, CommandInteraction, Guild, Message, MessageEmbed, Snowflake } from 'discord.js';
import { bugsChannel } from '../../index';
import { literalCommandType } from "../../Entities/Generic/commandType";
import { guildLoggerType } from "../../Entities/Generic/guildLoggerType";
import GenericGuildCommand from "./GenericGuildCommand";
import { GenericCommand } from "../GenericCommand";

export abstract class AbstractGuildCommand implements GenericGuildCommand {
    protected abstract _id: Snowflake;
    protected abstract _keyword: string;
    protected abstract _guide: string;
    protected abstract _usage: string;

    protected constructor() { }

    get id() {
        return this._id;
    }

    get keyword() {
        return this._keyword;
    }

    get guide() {
        return this._guide;
    }

    get usage() {
        return this._usage;
    }


    static init() { }

    abstract getCommandData(guildID: Snowflake): ApplicationCommandData;

    abstract execute(receivedMessage: Message, receivedCommand: literalCommandType): Promise<any>;

    abstract interactiveExecute(commandInteraction: CommandInteraction): Promise<any>;

    abstract getAliases(): string[];

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
        bugsChannel.send({ embeds: [emb] }).catch(internalErr => console.log(internalErr));
    }

    protected addKeywordToAliases(aliases: string[], keyword: string): string[] {
        return aliases.includes(keyword)
            ? [...aliases, keyword]
            : aliases
    }
}