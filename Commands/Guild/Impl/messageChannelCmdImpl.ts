import * as Discord from 'discord.js';
import { ApplicationCommandData, Message, TextChannel } from 'discord.js';
import { messageChannel as _keyword } from '../../keywords.json';
import { GmessageChannel as _guide } from '../../guides.json';
import { injectable } from "Inversify";
import { AbstractCommand } from "../AbstractCommand";
import { messageChannelCmd } from "../Interf/messageChannelCmd";
import { commandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";

@injectable()
export class MessageChannelCmdImpl extends AbstractCommand implements messageChannelCmd {
    private readonly _aliases = this.addKeywordToAliases
        (
            ['send', 'msgchannel', 'messagechannel', 'message_channel'],
            _keyword
        );

    getCommandData(): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide(),
            options: [
                {
                    name: 'channel',
                    description: 'targeted channel',
                    type: 'CHANNEL',
                    required: true
                },
                {
                    name: 'message',
                    description: 'the message',
                    type: 'STRING',
                    required: true
                }
            ]
        }
    }

    async interactiveExecute(interaction: Discord.CommandInteraction): Promise<any> {
        const sendChannel = interaction.options[0].channel as TextChannel;
        const messageContent = interaction.options[1].value as string;
        await sendChannel.send(messageContent, { split: true });
        const emb = new Discord.MessageEmbed({
            title: `Message send`,
            fields: [
                { name: `target`, value: sendChannel.toString() },
                { name: `message`, value: messageContent.substr(0, 1023) }
            ]
        })
        return interaction.reply({
            embeds: [emb],
            ephemeral: true
        });

    }

    async execute({ guild, mentions }: Message, { commandless2 }: commandType, addGuildLog: guildLoggerType) {
        const sendChannel = mentions.channels.first() as Discord.TextChannel;
        if (guild.channels.cache.has(sendChannel?.id) && sendChannel?.type === 'text')
            return sendChannel.send(commandless2)
                .then(() => addGuildLog(`sent ${commandless2} to ${sendChannel.name}`));
        else
            throw new Error(`Channel not found`);
    }

    getAliases(): string[] {
        return this._aliases;
    }

    getGuide(): string {
        return _guide;
    }

    getKeyword(): string {
        return _keyword;
    }
}