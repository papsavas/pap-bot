import { ApplicationCommandOptionData, ChatInputApplicationCommandData, Collection, CommandInteraction, Message, MessageEditOptions, MessageEmbed, Permissions, Snowflake, TextChannel } from 'discord.js';
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from '../../../Queries/Generic/Commands';
import { resolveMessageURL } from '../../../tools/resolveMessageURL';
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { editMessageCmd } from "../Interf/editMessageCmd";


const msgURLOptionLiteral: ApplicationCommandOptionData['name'] = 'message_url';
const editedMsgOptionLiteral: ApplicationCommandOptionData['name'] = 'edit';

//TODO: use message link for channel and message id
//* Requires Command Re-Registration  
export class EditMessageCmdImpl extends AbstractGuildCommand implements editMessageCmd {
    protected _id: Collection<Snowflake, Snowflake> = new Collection(null);
    protected _keyword = `editmsg`;
    protected _guide = `Edits a bot's text message`;
    protected _usage = `${this.keyword} <msg_url> <text>`;
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
                    name: msgURLOptionLiteral,
                    description: 'the URL of the message',
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

    async interactiveExecute(interaction: CommandInteraction) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        await interaction.deferReply({ ephemeral: true });
        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
            return interaction.editReply(`\`MANAGE_GUILD\` permissions required`);
        const messageURL = interaction.options.getString(msgURLOptionLiteral, true) as Snowflake;
        const newMessageContent = interaction.options.getString(editedMsgOptionLiteral, true);
        return this.handler(interaction, messageURL, { content: newMessageContent });

    }

    async execute(message: Message, { arg1, args2 }: commandLiteral) {
        const { member } = message;
        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
            return message.reply(`\`MANAGE_GUILD\` permissions required`);
        return this.handler(message, arg1, { content: args2 });
    }

    getAliases(): string[] {
        return this._aliases;
    }

    async handler(source: Message | CommandInteraction, messageURL: Message['url'], newMessageOptions: MessageEditOptions) {
        const [guildId, channelId, messageId] = resolveMessageURL(messageURL);
        if (!!channelId || guildId !== source.guildId)
            return this.respond(source, { content: "Please provide a valid message URL (right click => Copy Message Link)" });
        const targetChannel = source.guild.channels.cache.get(channelId);
        const targetMessage = await (targetChannel as TextChannel)?.messages.fetch(messageId);
        if (targetMessage.author.id !== source.client.user.id)
            return this.respond(source, { content: 'Cannot edit a message authored by another user' });
        return targetMessage?.edit(newMessageOptions)
            .then(editedMessage =>
                this.respond(source, {
                    embeds:
                        [
                            new MessageEmbed({
                                description: `[edited message](${editedMessage.url})`
                            })
                        ]
                })
            );
    }
}

