import * as Discord from 'discord.js';
import { ApplicationCommandData, ApplicationCommandOptionData, GuildChannel, Message, Snowflake } from 'discord.js';
import { editMessage as _keyword } from '../../keywords.json';
import { GeditMessage as _guide } from '../../guides.json';

import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { editMessageCmd } from "../Interf/editMessageCmd";
import * as e from '../../../errorCodes.json'
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildMap } from '../../..';
import { fetchCommandID } from '../../../Queries/Generic/Commands';

const channelOptionLiteral: ApplicationCommandOptionData['name'] = 'channel';
const msgidOptionLiteral: ApplicationCommandOptionData['name'] = 'message_id';
const editedMsgOptionLiteral: ApplicationCommandOptionData['name'] = 'edit';
export class EditMessageCmdImpl extends AbstractGuildCommand implements editMessageCmd {
    readonly id: Snowflake = fetchCommandID(_keyword);

    private readonly _aliases = this.addKeywordToAliases
        (
            ['editmessage', 'messageedit', 'messagedit', 'editmsg', 'msgedit'],
            _keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide(),
            options: [
                {
                    name: channelOptionLiteral,
                    description: 'target channel',
                    type: 'CHANNEL',
                    required: true
                },
                {
                    name: msgidOptionLiteral,
                    description: 'the id of the message',
                    type: 'STRING',
                    required: true
                },
                {
                    name: editedMsgOptionLiteral,
                    description: 'new message',
                    type: 'STRING',
                    required: true
                }
            ]
        }
    }

    async interactiveExecute(interaction: Discord.CommandInteraction): Promise<any> {
        const targetChannel = interaction.options.get(channelOptionLiteral).channel as GuildChannel;
        const messageID = interaction.options.get(msgidOptionLiteral).value as Snowflake
        await interaction.defer({ ephemeral: true });
        const targetMessage = await (targetChannel as Discord.TextChannel)?.messages.fetch(messageID);
        if (targetMessage.author != interaction.client.user)
            return interaction.reply('Cannot edit a message authored by another user');
        const editedMessage = await targetMessage?.edit(interaction.options.get(editedMsgOptionLiteral).value as string);
        return interaction.editReply(
            new Discord.MessageEmbed({
                description: `[edited message](${editedMessage.url})`
            })
        );
    }

    async execute(
        { channel, mentions, guild, url }: Message,
        { arg1, arg2, commandless2, commandless3 }: literalCommandType
    ): Promise<any> {

        try {
            const fetchedMessage = await channel.messages.fetch(arg1 as Snowflake)
            const editedMessage = await fetchedMessage
                .edit(commandless2)
            await channel.send({
                embed: {
                    description: `[edited message](${editedMessage.url})`
                }
            });
            return new Promise((res, rej) => res('edit message success'));
        } catch (err) {
            if (err.code == e["Unknown message"] || err.code == e["Invalid form body"]) {
                try {
                    const targetChannel: Discord.GuildChannel = guild.channels.cache
                        .find(c => c.id == mentions.channels?.firstKey())

                    const targetMessage = await (targetChannel as Discord.TextChannel)?.messages.fetch(arg2 as Snowflake);

                    const editedMessage = await targetMessage?.edit(commandless3);
                    const sendLinkMessage = await channel.send(new Discord.MessageEmbed(
                        { description: `[edited message](${editedMessage.url})` }
                    ));
                    return new Promise((res, rej) => res('edit message success'));
                } catch (err) {
                    return new Promise((res, rej) => rej(`edit message failed\n${url}`));
                }
            } else {
                return new Promise((res, rej) => rej(`edit message failed\nreason:${err.toString()}`));
            }
        }

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

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }

}