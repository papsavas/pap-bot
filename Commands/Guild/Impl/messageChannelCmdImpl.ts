import * as Discord from 'discord.js';
import { ApplicationCommandData, ApplicationCommandOptionData, Message, Snowflake, TextChannel } from 'discord.js';
import { guildMap } from '../../..';
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { fetchCommandID } from '../../../Queries/Generic/Commands';
import { GmessageChannel as _guide } from '../../guides.json';
import { messageChannel as _keyword } from '../../keywords.json';
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { messageChannelCmd } from "../Interf/messageChannelCmd";


const channelOptionLiteral: ApplicationCommandOptionData['name'] = 'channel';
const msgOptionLiteral: ApplicationCommandOptionData['name'] = 'message';

export class MessageChannelCmdImpl extends AbstractGuildCommand implements messageChannelCmd {
    protected _id: Snowflake;
    private constructor() { super() }

    static async init(): Promise<messageChannelCmd> {
        const cmd = new MessageChannelCmdImpl();
        cmd._id = await fetchCommandID(_keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['send', 'msgchannel', 'messagechannel', 'message_channel'],
            _keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide(),
            options: [
                {
                    name: channelOptionLiteral,
                    description: 'targeted channel',
                    type: 'CHANNEL',
                    required: true
                },
                {
                    name: msgOptionLiteral,
                    description: 'the message',
                    type: 'STRING',
                    required: true
                }
            ]
        }
    }

    async interactiveExecute(interaction: Discord.CommandInteraction): Promise<any> {
        const sendChannel = interaction.options.get(channelOptionLiteral).channel as TextChannel;
        const messageContent = interaction.options.get(msgOptionLiteral).value as string;
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

    async execute({ guild, mentions }: Message, { commandless2 }: literalCommandType) {
        const sendChannel = mentions.channels.first() as Discord.TextChannel;
        if (guild.channels.cache.has(sendChannel?.id) && sendChannel?.type === 'text')
            return sendChannel.send(commandless2)
                .then(() => this.addGuildLog(guild.id, `sent ${commandless2} to ${sendChannel.name}`));
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

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}