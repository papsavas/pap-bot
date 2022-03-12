import { ApplicationCommandOptionData, ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData, ChatInputCommandInteraction, Collection, CommandInteraction, Embed, Message, MessageEditOptions, PermissionFlagsBits, Snowflake, TextChannel } from 'discord.js';
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
    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `editmsg`;
    readonly guide = `Edits a bot's text message`;
    readonly usage = `${this.keyword} <msg_url> <text>`;
    private constructor() { super() }

    static async init(): Promise<editMessageCmd> {
        const cmd = new EditMessageCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    readonly aliases = this.mergeAliases
        (
            ['editmessage', 'messageedit', 'messagedit', 'editmsg', 'msgedit'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: msgURLOptionLiteral,
                    description: 'the URL of the message',
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: editedMsgOptionLiteral,
                    description: 'new message',
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        }
    }

    async interactiveExecute(interaction: ChatInputCommandInteraction) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        await interaction.deferReply({ ephemeral: true });
        if (!member.permissions.has(PermissionFlagsBits.ManageGuild))
            return interaction.editReply(`\`MANAGE_GUILD\` permissions required`);
        const messageURL = interaction.options.getString(msgURLOptionLiteral, true) as Snowflake;
        const newMessageContent = interaction.options.getString(editedMsgOptionLiteral, true);
        return this.handler(interaction, messageURL, { content: newMessageContent });

    }

    async execute(message: Message, { arg1, args2 }: commandLiteral) {
        const { member } = message;
        if (!member.permissions.has(PermissionFlagsBits.ManageGuild))
            return message.reply(`\`MANAGE_GUILD\` permissions required`);
        return this.handler(message, arg1, { content: args2 });
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
                            new Embed({
                                description: `[edited message](${editedMessage.url})`
                            })
                        ]
                })
            );
    }
}

