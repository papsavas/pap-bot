import {
    ApplicationCommandOptionData, ChatInputApplicationCommandData, Collection, CommandInteraction,
    Constants,
    GuildMember, Message, MessageEmbed, PermissionResolvable, Permissions, Snowflake
} from 'discord.js';
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from '../../../Queries/Generic/Commands';
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { dmMemberCmd } from "../Interf/dmMemberCmd";



const requiredPerm = Permissions.FLAGS.ADMINISTRATOR;
const permLiteral: PermissionResolvable = 'ADMINISTRATOR';
const userOptionLiteral: ApplicationCommandOptionData['name'] = 'user';
const messageOptionLiteral: ApplicationCommandOptionData['name'] = 'message';
export class DmMemberCmdImpl extends AbstractGuildCommand implements dmMemberCmd {

    protected _id: Collection<Snowflake, Snowflake> = new Collection(null);
    protected _keyword = `dm`;
    protected _guide = `Sends DM to a specific member`;
    protected _usage = `${this.keyword} member/username/nickname message`;
    private constructor() { super() }

    static async init(): Promise<dmMemberCmd> {
        const cmd = new DmMemberCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    readonly #aliases = this.mergeAliases
        (
            ['directmessage', 'message', 'dm'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: userOptionLiteral,
                    description: 'user to dm',
                    type: 'USER',
                    required: true
                },
                {
                    name: messageOptionLiteral,
                    description: 'message to user',
                    type: 'STRING',
                    required: true
                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {

        if (!(interaction.member as GuildMember).permissions.has(requiredPerm))
            return interaction.reply({
                content: `\`\`\`${permLiteral} permissions needed\`\`\``,
                ephemeral: true
            });

        const user = interaction.options.getUser(userOptionLiteral, true);
        const messageContent = interaction.options.getString(messageOptionLiteral, true);
        const sendEmb = new MessageEmbed({
            author: {
                name: "from: " + interaction.guild.name,
                //icon_url: `https://www.theindianwire.com/wp-content/uploads/2020/11/Google_Messages_logo.png`,
                //https://upload.wikimedia.org/wikipedia/commons/0/05/Google_Messages_logo.svg
            },
            title: `You have a message ${user.username}`,
            thumbnail: { url: interaction.guild.iconURL({ format: "png", size: 128 }) },
            color: "AQUA",
            description: messageContent,
            //video: { url: attachments?.proxyURL}, cannot send video via rich embed
            timestamp: new Date()
        })
        return user.send({ embeds: [sendEmb] })
            .then((smsg) => interaction.reply({
                content: `message send to ${user.toString()}\npreview`,
                ephemeral: true,
                embeds: [sendEmb]
            }))
            .catch(err => {
                if (err.code === Constants.APIErrors.CANNOT_MESSAGE_USER) {
                    interaction.reply(`Could not dm ${user.username}`);
                }
            })
    }

    async execute(
        message: Message,
        { args2 }: commandLiteral
    ) {
        const { guild, attachments, mentions, member } = message;
        if (!member.permissions.has(requiredPerm))
            return message.reply.call(`\`\`\`{${permLiteral} permissions required\`\`\``);

        const user = mentions.users.first();
        const text = args2;
        if (!text && !attachments)
            throw new Error('Cannot send empty message');

        const sendEmb = new MessageEmbed({
            author: {
                name: "from: " + guild.name,
                //icon_url: `https://www.theindianwire.com/wp-content/uploads/2020/11/Google_Messages_logo.png`,
                //https://upload.wikimedia.org/wikipedia/commons/0/05/Google_Messages_logo.svg
            },
            title: `You have a message ${user.username}`,
            thumbnail: { url: guild.iconURL({ format: "png", size: 128 }) },
            image: { url: attachments?.first().url },
            color: "AQUA",
            description: text,
            //video: { url: attachments?.proxyURL}, cannot send video via rich embed
            timestamp: new Date()
        })
        return user.send({ embeds: [sendEmb] })
            .then((smsg) => message.reply({
                content: `message sent to ${user.toString()}\npreview:`,
                embeds: [sendEmb]
            }))
            .catch(err => {
                if (err.code === Constants.APIErrors.CANNOT_MESSAGE_USER) {
                    throw new Error(`Could not dm ${user.username}`);
                }
            })
    }

    getAliases(): string[] {
        return this.#aliases;
    }


}