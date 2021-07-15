import { ApplicationCommandData, ApplicationCommandOptionData, CommandInteraction, Constants, GuildChannel, Message, MessageEmbed, Snowflake, TextChannel } from 'discord.js';
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildMap } from '../../../index';
import { fetchCommandID } from '../../../Queries/Generic/Commands';
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { editMessageCmd } from "../Interf/editMessageCmd";


const channelOptionLiteral: ApplicationCommandOptionData['name'] = 'channel';
const msgidOptionLiteral: ApplicationCommandOptionData['name'] = 'message_id';
const editedMsgOptionLiteral: ApplicationCommandOptionData['name'] = 'edit';
export class EditMessageCmdImpl extends AbstractGuildCommand implements editMessageCmd {
    protected _id: Snowflake;
    protected _keyword = `editmsg`;
    protected _guide = `Edits a bot's text message`;
    protected _usage = `editmessage <channel> <msg_id> <text>`;
    private constructor() { super() }

    static async init(): Promise<editMessageCmd> {
        const cmd = new EditMessageCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['editmessage', 'messageedit', 'messagedit', 'editmsg', 'msgedit'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
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
        const targetChannel = interaction.options.get(channelOptionLiteral).channel as GuildChannel;
        const messageID = interaction.options.get(msgidOptionLiteral).value as Snowflake
        await interaction.defer({ ephemeral: true });
        const targetMessage = await (targetChannel as TextChannel)?.messages.fetch(messageID);
        if (targetMessage.author != interaction.client.user)
            return interaction.reply('Cannot edit a message authored by another user');
        const editedMessage = await targetMessage?.edit(interaction.options.get(editedMsgOptionLiteral).value as string);
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
        { channel, mentions, guild, url }: Message,
        { arg1, arg2, commandless2, commandless3 }: literalCommandType
    ): Promise<any> {

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

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }

}