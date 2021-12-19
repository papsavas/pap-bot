import { ApplicationCommandOptionData, ChatInputApplicationCommandData, Collection, CommandInteraction, Constants, Message, MessageEmbed, Permissions, Snowflake, TextChannel } from 'discord.js';
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from '../../../Queries/Generic/Commands';
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { editMessageCmd } from "../Interf/editMessageCmd";


const channelOptionLiteral: ApplicationCommandOptionData['name'] = 'channel';
const msgidOptionLiteral: ApplicationCommandOptionData['name'] = 'message_id';
const editedMsgOptionLiteral: ApplicationCommandOptionData['name'] = 'edit';

//TODO: use message link for channel and message id
//* Requires Command Re-Registration  
export class EditMessageCmdImpl extends AbstractGuildCommand implements editMessageCmd {
    protected _id: Collection<Snowflake, Snowflake> = new Collection(null);
    protected _keyword = `editmsg`;
    protected _guide = `Edits a bot's text message`;
    protected _usage = `${this.keyword} <channel> <msg_id> <text>`;
    private constructor() { super() }

    static async init(): Promise<editMessageCmd> {
        const cmd = new EditMessageCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    private readonly _aliases = this.mergeAliases
        (
            ['editmessage', 'messageedit', 'messagedit', 'editmsg', 'msgedit'],
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

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
            return interaction.reply(`\`MANAGE_GUILD\` permissions required`);
        const targetChannel = interaction.options.getChannel(channelOptionLiteral, true);
        const messageID = interaction.options.getString(msgidOptionLiteral, true) as Snowflake;
        await interaction.deferReply({ ephemeral: true });
        const targetMessage = await (targetChannel as TextChannel)?.messages.fetch(messageID);
        if (targetMessage.author.id !== interaction.client.user.id)
            return interaction.reply('Cannot edit a message authored by another user');
        const editedMessage = await targetMessage?.edit(interaction.options.getString(editedMsgOptionLiteral, true));
        return interaction.editReply({
            embeds:
                [
                    new MessageEmbed({
                        description: `[edited message](${editedMessage.url})`
                    })
                ]
        });
    }

    async execute(
        message: Message,
        { arg1, arg2, commandless2, commandless3 }: commandLiteral
    ): Promise<any> {
        const { channel, mentions, guild, url, member } = message;
        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
            return message.reply(`\`MANAGE_GUILD\` permissions required`);
        try {
            const fetchedMessage = await channel.messages.fetch(arg1 as Snowflake)
            const editedMessage = await fetchedMessage
                .edit(commandless2)
            await channel.send({
                embeds: [{
                    description: `[edited message](${editedMessage.url})`
                }]
            });
            return new Promise((res, rej) => res('edit message success'));
        } catch (err) {
            if ([Constants.APIErrors.INVALID_FORM_BODY, Constants.APIErrors.UNKNOWN_MESSAGE].includes(err.code)) {
                try {
                    const targetChannel = guild.channels.cache
                        .find(c => c.id == mentions.channels?.firstKey())

                    const targetMessage = await (targetChannel as TextChannel)?.messages.fetch(arg2 as Snowflake);

                    const editedMessage = await targetMessage?.edit(commandless3);
                    const sendLinkMessage = await channel.send({
                        embeds: [
                            new MessageEmbed(
                                { description: `[edited message](${editedMessage.url})` }
                            )
                        ]
                    });
                    return Promise.reject('edit message success');
                } catch (err) {
                    return Promise.reject(`edit message failed\n${url}`);
                }
            } else {
                return Promise.reject(`edit message failed\nreason:${err.toString()}`);
            }
        }

    }

    getAliases(): string[] {
        return this._aliases;
    }



}