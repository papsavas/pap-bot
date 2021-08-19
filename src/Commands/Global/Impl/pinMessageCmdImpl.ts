import { ApplicationCommandOptionData, ChatInputApplicationCommandData, Collection, CommandInteraction, Constants, Message, MessageEmbed, Snowflake, TextChannel } from "discord.js";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { extractId } from "../../../tools/extractMessageId";
import { AbstractGlobalCommand } from "../AbstractGlobalCommand";
import { pinMessageCmd } from "../Interf/pinMessageCmd";

const msgidOptionLiteral: ApplicationCommandOptionData['name'] = 'message_id';
const reasonOptionLiteral: ApplicationCommandOptionData['name'] = 'reason';

export class PinMessageCmdImpl extends AbstractGlobalCommand implements pinMessageCmd {

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `pin`;
    protected _guide = `Pins a message`;
    protected _usage = `pin <msg_id> [reason]`;
    private constructor() { super() }

    static async init(): Promise<pinMessageCmd> {
        const cmd = new PinMessageCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['pin', 'πιν'],
            this.keyword
        );

    getCommandData(): ChatInputApplicationCommandData {
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
                    description: 'reason for pinning',
                    type: 'STRING',
                    required: false
                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const channel = interaction.channel as TextChannel;
        const user = interaction.user;
        const pinReason = interaction.options.getString(reasonOptionLiteral) ?? ``;
        const pinningMessageID = extractId(interaction.options.getString(msgidOptionLiteral, true));
        try {
            const fetchedMessage = await channel.messages.fetch(pinningMessageID);
            if (fetchedMessage.pinned)
                return interaction.reply({
                    embeds: [{ description: `[message](${fetchedMessage.url}) already pinned 😉` }],
                    ephemeral: true
                });
            else if (!fetchedMessage.pinnable)
                throw new Error('Cannot pin this message')
            return fetchedMessage.pin()
                .then((pinnedMessage) => {
                    interaction.reply({
                        embeds: [
                            new MessageEmbed({
                                author: {
                                    name: user.username,
                                    iconURL: user.avatarURL()
                                },
                                title: `Pinned Message  📌`,
                                description: pinnedMessage.content?.length > 0 ?
                                    `[${pinnedMessage.content.substring(0, 100)}...](${pinnedMessage.url})` :
                                    `[Click to jump](${pinnedMessage.url})`,
                                color: 'GREEN',
                                footer: { text: pinReason }
                            })
                        ]
                    })
                })
                .catch(err => {
                    interaction.reply({
                        content: 'could not pin message',
                        embeds: [new MessageEmbed({
                            description: err.toString()
                        })]
                    });
                });
        } catch (error) {
            if (error.code === Constants.APIErrors.UNKNOWN_MESSAGE)
                return interaction.reply({
                    content: `*invalid message id. Message needs to be of channel ${channel.toString()}*`,
                    ephemeral: true
                })
        }
    }

    async execute(message: Message, { arg1, commandless2 }: commandLiteral): Promise<any> {
        const { channel, author } = message;
        let pinReason = commandless2 ? commandless2 : ``;
        pinReason += `\nby ${message.member.displayName}`;
        let pinningMessageID = extractId(arg1);
        let fetchedMessage: Message;
        try {
            fetchedMessage = await channel.messages.fetch(pinningMessageID);
        } catch (error) {
            if (error.code === Constants.APIErrors.UNKNOWN_MESSAGE)
                return message.reply(`*invalid message id. Message needs to be of channel ${channel.toString()}*`);
        }
        if (fetchedMessage.pinned)
            return message.reply({ embeds: [{ description: `[message](${fetchedMessage.url}) already pinned 😉` }] });
        else if (!fetchedMessage.pinnable)
            throw new Error('Cannot pin this message')

        return channel.messages.fetch(pinningMessageID)
            .then((fetchedMessage) => {
                fetchedMessage.pin()
                    .then((pinnedMessage) => {
                        message.channel.send({
                            embeds: [
                                new MessageEmbed({
                                    author: {
                                        name: author.username,
                                        iconURL: author.avatarURL()
                                    },
                                    title: `Pinned Message  📌`,
                                    description: pinnedMessage.content?.length > 0 ?
                                        `[${pinnedMessage.content.substring(0, 100)}...](${pinnedMessage.url})` :
                                        `[Click to jump](${pinnedMessage.url})`,
                                    color: 'GREEN',
                                    footer: { text: pinReason }
                                })
                            ]
                        });
                        if (message.deletable)
                            setTimeout(() => { message.delete().catch() }, 5000);
                    });
            })
    }

    getAliases(): string[] {
        return this._aliases;
    }
}
