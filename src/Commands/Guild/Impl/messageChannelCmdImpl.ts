import { ApplicationCommandOptionData, ChatInputApplicationCommandData, Collection, CommandInteraction, Message, MessageEmbed, Permissions, Snowflake, TextChannel } from 'discord.js';
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from '../../../Queries/Generic/Commands';
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { messageChannelCmd } from "../Interf/messageChannelCmd";


const channelOptionLiteral: ApplicationCommandOptionData['name'] = 'channel';
const msgOptionLiteral: ApplicationCommandOptionData['name'] = 'message';

export class MessageChannelCmdImpl extends AbstractGuildCommand implements messageChannelCmd {
    protected _id: Collection<Snowflake, Snowflake> = new Collection(null);
    protected _keyword = `send`;
    protected _guide = `Messages a specific channel on the guild`;
    protected _usage = `${this.keyword} <channel> <text>`;
    private constructor() { super() }

    static async init(): Promise<messageChannelCmd> {
        const cmd = new MessageChannelCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    private readonly _aliases = this.mergeAliases
        (
            ['send', 'msgchannel', 'messagechannel', 'message_channel'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
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

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
            return interaction.reply(`\`MANAGE_GUILD\` permissions required`);
        const sendChannel = interaction.options.getChannel(channelOptionLiteral, true) as TextChannel;
        const messageContent = interaction.options.getString(msgOptionLiteral, true);
        await sendChannel.send({
            content: messageContent.substr(0, 2000),
        });
        const emb = new MessageEmbed({
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

    async execute(message: Message, { commandless2 }: commandLiteral) {
        const { guild, mentions, member } = message;
        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
            return message.reply(`\`MANAGE_GUILD\` permissions required`);
        const sendChannel = mentions.channels.first();
        if (guild.channels.cache.has(sendChannel?.id) && !!sendChannel?.isText())
            return sendChannel.send(commandless2)
        else
            throw new Error(`Channel not found`);
    }

    getAliases(): string[] {
        return this._aliases;
    }
}