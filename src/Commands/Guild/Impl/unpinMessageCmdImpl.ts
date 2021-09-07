import { ApplicationCommandOptionData, ChatInputApplicationCommandData, Collection, CommandInteraction, Message, MessageEmbed, Snowflake } from "discord.js";
import { guildMap } from "../../..";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { separateIds } from "../../../tools/seperateIds";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { unpinMessageCmd } from "../Interf/unpinMessageCmd";


const msgidOptionLiteral: ApplicationCommandOptionData['name'] = 'message_id';
const reasonOptionLiteral: ApplicationCommandOptionData['name'] = 'reason';

//TODO: implement request handler
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

    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
        const pinReason = interaction.options.getString(reasonOptionLiteral) ?? ``;
        const [guildId, channelId, pinningMessageID] = separateIds(interaction.options.getString(msgidOptionLiteral, true));
        return handleRequest(interaction, pinReason, channelId, pinningMessageID);
    }

    async execute(message: Message, { arg1, commandless2 }: commandLiteral): Promise<unknown> {
        const pinReason = commandless2 ?? ``;
        const [guildId, channelId, pinningMessageID] = separateIds(arg1);
        return handleRequest(message, pinReason, channelId, pinningMessageID);

    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}

async function handleRequest(
    request: Message | CommandInteraction,
    unpinReason: string, channelId: Snowflake, messageId: Snowflake) {
    const ephemeralResponse = (s: string) =>
        request.type === 'APPLICATION_COMMAND' ? { content: s, ephemeral: true } : { content: s }
    const ephemeralEmbedResponse = (e: MessageEmbed[]) =>
        request.type === 'APPLICATION_COMMAND' ? { embeds: e, ephemeral: true } : { embeds: e }

    const { channel, guild } = request;
    const user = request.type === "APPLICATION_COMMAND" ?
        (request as CommandInteraction).user : (request as Message).author;

    const targetChannel = !channelId ? channel : (await guild.channels.fetch(channelId));
    if (!targetChannel.isText())
        return request.reply(
            ephemeralResponse(`channel ${targetChannel.name} is not a text channel`)
        )
    const fetchedMessage = await targetChannel.messages.fetch(messageId);
    if (!fetchedMessage)
        return request.reply(
            ephemeralResponse(`To unpin messages from other channels, provide a message url instead of an id`)
        )
    if (!fetchedMessage?.pinned)
        return request.reply(
            ephemeralEmbedResponse([new MessageEmbed({ description: `[message](${fetchedMessage.url}) is not pinned` })])
        )
    else if (!fetchedMessage?.pinnable)
        return request.reply(
            ephemeralResponse('Cannot unpin this message')
        )
    return fetchedMessage?.unpin()
        .then((unpinnedMessage) => {
            request.reply({
                embeds: [
                    new MessageEmbed({
                        author: {
                            name: user.username,
                            iconURL: user.avatarURL()
                        },
                        title: `Unpinned Message  📌`,
                        description: unpinnedMessage.content?.length > 0 ?
                            `[${unpinnedMessage.content.substring(0, 100)}...](${unpinnedMessage.url})` :
                            `[Click to jump](${unpinnedMessage.url})`,
                        color: 'RED',
                        footer: { text: unpinReason }
                    })
                ]
            })
        })
}
