import { ApplicationCommandOptionData, ChatInputApplicationCommandData, Collection, CommandInteraction, Constants, Message, MessageEmbed, Snowflake, TextChannel } from "discord.js";
import { guildMap } from "../../..";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { extractId } from "../../../tools/extractMessageId";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { unpinMessageCmd } from "../Interf/unpinMessageCmd";


const msgidOptionLiteral: ApplicationCommandOptionData['name'] = 'message_id';
const reasonOptionLiteral: ApplicationCommandOptionData['name'] = 'reason';

export class UnpinMessageCmdImpl extends AbstractGuildCommand implements unpinMessageCmd {

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `unpin`;
    protected _guide = `Unpins a message`;
    protected _usage = `unpin <msg_id> [reason]`;

    private constructor() { super() }

    static async init(): Promise<unpinMessageCmd> {
        const cmd = new UnpinMessageCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['unpin', 'ανπιν'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: msgidOptionLiteral,
                    description: 'targeted message id or link',
                    type: 'STRING',
                    required: true
                },
                {
                    name: reasonOptionLiteral,
                    description: 'reason for unpinning',
                    type: 'STRING',
                    required: false
                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const { channel, user } = interaction;
        const unpinReason = interaction.options.getString(reasonOptionLiteral) ?? ``;
        const pinningMessageID = extractId(interaction.options.getString(msgidOptionLiteral, true));
        let fetchedMessage: Message;
        try {
            fetchedMessage = await channel.messages.fetch(pinningMessageID);
        } catch (error) {
            if (error.code === Constants.APIErrors.UNKNOWN_MESSAGE)
                return interaction.reply({
                    content: `*invalid message id. Message needs to be of channel ${channel.toString()}*`,
                    ephemeral: true
                });
        }

        if (!fetchedMessage.pinned)
            return interaction.reply({
                embeds: [{ description: `[message](${fetchedMessage.url}) is not pinned` }],
                ephemeral: true
            });
        else if (!fetchedMessage.pinnable)
            throw new Error('Cannot pin this message')
        return fetchedMessage.unpin()
            .then((unpinnedMessage) => {
                //addGuildLog(`message pinned:\n${pinnedMessage.url} with reason ${pinReason}`);
                interaction.reply({
                    embeds: [
                        new MessageEmbed({
                            author: {
                                name: user.username,
                                iconURL: user.avatarURL()
                            },
                            title: `Unpinned Message  📌`,
                            description: unpinnedMessage.content?.length > 0 ?
                                `[${unpinnedMessage.content.substring(0, 40)}...](${unpinnedMessage.url})` :
                                `[Click to jump](${unpinnedMessage.url})`,
                            color: 'DARK_RED',
                            footer: { text: unpinReason }
                        })
                    ]
                })
            })
            .catch(err => {
                interaction.reply('could not pin message');
            });
    }

    async execute(message: Message, { arg1, commandless2 }: commandLiteral): Promise<any> {
        const { channel, author } = message;
        let unpinReason = commandless2 ? commandless2 : `undefined`;
        unpinReason += `\nby ${author.username}`;
        let unpinnedMessageId = extractId(arg1);
        let fetchedMessage: Message;
        try {
            fetchedMessage = await channel.messages.fetch(unpinnedMessageId);
        } catch (error) {
            if (error.code === Constants.APIErrors.UNKNOWN_MESSAGE)
                return message.reply(`*invalid message id. Message needs to be of channel ${channel.toString()}*`);
        }
        if (!fetchedMessage.pinned)
            return message.reply({ embeds: [{ description: `[message](${fetchedMessage.url}) is not pinned` }] });
        else if (!fetchedMessage.pinnable)
            throw new Error('Cannot pin this message')
        return (channel as TextChannel).messages.fetch(unpinnedMessageId)
            .then((msg) => {
                msg.unpin()
                    .then((msg) => {
                        msg.channel.send({
                            embeds: [
                                new MessageEmbed({
                                    author: {
                                        name: author.username,
                                        iconURL: author.avatarURL()
                                    },
                                    title: `Unpinned Message  📌`,
                                    description: msg.content?.length > 0 ?
                                        `[${msg.content.substring(0, 40)}...](${msg.url})` :
                                        `[Click to jump](${msg.url})`,
                                    color: 'DARK_RED',
                                    footer: { text: unpinReason }
                                })
                            ]
                        })
                        if (message.deletable)
                            setTimeout(() => { message.delete().catch() }, 3000);
                    });
            })
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}
