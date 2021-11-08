import { ApplicationCommandOptionData, ChatInputApplicationCommandData, Collection, CommandInteraction, Message, MessageEmbed, Snowflake } from "discord.js";
import { guildMap } from "../../..";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { separateIds } from "../../../tools/seperateIds";
import { pinMessageCmd } from "../../Guild/Interf/pinMessageCmd";
import { AbstractGuildCommand } from "../AbstractGuildCommand";

const msgidOptionLiteral: ApplicationCommandOptionData['name'] = 'message_id';
const reasonOptionLiteral: ApplicationCommandOptionData['name'] = 'reason';

export class PinMessageCmdImpl extends AbstractGuildCommand implements pinMessageCmd {

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
                    description: 'reason for pinning',
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
    pinReason: string, channelId: Snowflake, messageId: Snowflake
) {
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
            ephemeralResponse(`To pin messages from other channels, provide a message url instead of an id`)
        )
    if (fetchedMessage?.pinned)
        return request.reply(
            ephemeralEmbedResponse([new MessageEmbed({ description: `[message](${fetchedMessage.url}) already pinned 😉` })])
        )
    else if (!fetchedMessage?.pinnable)
        return request.reply(
            ephemeralResponse('Cannot pin this message')
        )
    return fetchedMessage.pin()
        .then((pinnedMessage) => {
            request.reply({
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
}
