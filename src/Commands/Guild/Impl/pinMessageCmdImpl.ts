import { ApplicationCommandData, ApplicationCommandOptionData, CommandInteraction, Constants, GuildMember, Message, MessageEmbed, Snowflake, TextChannel } from "discord.js";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildMap } from "../../../index";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { extractId } from "../../../toolbox/extractMessageId";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { pinMessageCmd } from "../Interf/pinMessageCmd";

const msgidOptionLiteral: ApplicationCommandOptionData['name'] = 'message_id';
const reasonOptionLiteral: ApplicationCommandOptionData['name'] = 'reason';

//TODO: make this global
export class PinMessageCmdImpl extends AbstractGuildCommand implements pinMessageCmd {

    protected _id: Snowflake;
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

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
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
        const reason = interaction.options.get(reasonOptionLiteral);
        const member = interaction.member as GuildMember;
        const pinReason = reason ? reason.value as string : ``;
        const pinningMessageID = extractId(interaction.options.get(msgidOptionLiteral).value as string);
        try {
            const fetchedMessage = await channel.messages.fetch(pinningMessageID);
            if (fetchedMessage.pinned)
                return interaction.reply({
                    embeds: [{ description: `[message](${fetchedMessage.url}) already pinned 😉` }],
                    ephemeral: true
                });
            return fetchedMessage.pin()
                .then((pinnedMessage) => {
                    this.addGuildLog(interaction.guildId, `message pinned:\n${pinnedMessage.url} with reason ${pinReason}`);
                    interaction.reply({
                        embeds: [
                            new MessageEmbed({
                                author: {
                                    name: member.displayName,
                                    iconURL: member.user.avatarURL()
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

    async execute(message: Message, { arg1, commandless2 }: literalCommandType): Promise<any> {
        const channel = message.channel;
        let pinReason = commandless2 ? commandless2 : ``;
        pinReason += `\nby ${message.member.displayName}`;
        let pinningMessageID = extractId(arg1);
        let fetchedMessage;
        try {
            fetchedMessage = await channel.messages.fetch(pinningMessageID);
        } catch (error) {
            if (error.code === Constants.APIErrors.UNKNOWN_MESSAGE)
                return message.reply(`*invalid message id. Message needs to be of channel ${channel.toString()}*`);
        }
        if (fetchedMessage.pinned)
            return message.reply({ embeds: [{ description: `[message](${fetchedMessage.url}) already pinned 😉` }] });

        return channel.messages.fetch(pinningMessageID)
            .then((fetchedMessage) => {
                fetchedMessage.pin()
                    .then((pinnedMessage) => {
                        this.addGuildLog(message.guild.id, `message pinned:\n${pinnedMessage.url} with reason ${pinReason}`);
                        if (message.deletable)
                            message.client.setTimeout(() => { message.delete().catch() }, 3000);
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
