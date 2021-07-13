import { ApplicationCommandData, ApplicationCommandOptionData, CommandInteraction, Constants, GuildMember, Message, MessageEmbed, Snowflake, TextChannel } from "discord.js";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildMap } from "../../../index";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { extractId } from "../../../toolbox/extractMessageId";
import { unpinMessage as _keyword } from "../../keywords.json";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { unpinMessageCmd } from "../Interf/unpinMessageCmd";


const msgidOptionLiteral: ApplicationCommandOptionData['name'] = 'message_id';
const reasonOptionLiteral: ApplicationCommandOptionData['name'] = 'reason';
export class UnpinMessageCmdImpl extends AbstractGuildCommand implements unpinMessageCmd {

    protected _id: Snowflake;
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

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: _keyword,
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
                    description: 'reason for unpinning',
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
        const unpinReason = reason ? reason.value as string : ``;
        const pinningMessageID = extractId(interaction.options.get(msgidOptionLiteral).value as string);
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
        return fetchedMessage.unpin()
            .then((unpinnedMessage) => {
                //addGuildLog(`message pinned:\n${pinnedMessage.url} with reason ${pinReason}`);
                interaction.reply({
                    embeds: [
                        new MessageEmbed({
                            author: {
                                name: member.displayName,
                                iconURL: member.user.avatarURL()
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

    async execute(message: Message, { arg1, commandless2 }: literalCommandType): Promise<any> {
        const [channel, member] = [message.channel, message.member];
        let unpinReason = commandless2 ? commandless2 : `undefined`;
        unpinReason += `\nby ${member.displayName}`;
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

        return (channel as TextChannel).messages.fetch(unpinnedMessageId)
            .then((msg) => {
                msg.unpin()
                    .then((msg) => {
                        this.addGuildLog(message.guild.id, `message unpinned:\n${msg.url} with reason ${unpinReason}`);
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
