
import { ApplicationCommandData, Guild, MessageEmbed, Snowflake } from 'discord.js';
import "reflect-metadata";
import { bugsChannel } from '../../index';
import { AbstractCommand } from "../AbstractCommand";
import GenericGuildCommand from "./GenericGuildCommand";

export abstract class AbstractGuildCommand extends AbstractCommand implements GenericGuildCommand {

    abstract getCommandData(guildID: Snowflake): ApplicationCommandData;

    abstract addGuildLog(guildID: Snowflake, log: string): string | void

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
}