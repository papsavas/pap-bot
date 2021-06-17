import { dmMember as _keyword } from '../../keywords.json';
import { GdmMember as _guide } from '../../guides.json';

import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { dmMemberCmd } from "../Interf/dmMemberCmd";
import * as e from '../../../errorCodes.json'
import {
    ApplicationCommandData, ApplicationCommandOptionData, CommandInteraction,
    GuildMember, Message, MessageEmbed, PermissionResolvable, Permissions, Snowflake
} from 'discord.js';
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import { guildMap } from '../../..';
import { fetchCommandID } from '../../../Queries/Generic/Commands';


const requiredPerm = Permissions.FLAGS.ADMINISTRATOR;
const permLiteral: PermissionResolvable = 'ADMINISTRATOR';

const messageOptionLiteral: ApplicationCommandOptionData['name'] = 'message';
export class DmMemberCmdImpl extends AbstractGuildCommand implements dmMemberCmd {

    protected _id: Snowflake;
    protected _keyword = `dm`;
    protected _guide = `Sends DM to a specific member`;
    protected _usage = `dm member/username/nickname message`;
    private constructor() { super() }

    static async init(): Promise<dmMemberCmd> {
        const cmd = new DmMemberCmdImpl();
        cmd._id = await fetchCommandID(_keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['directmessage', 'message', 'dm'],
            _keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide(),
            options: [
                {
                    name: 'user',
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

        const user = interaction.options.find(op => op.type == "USER").user;
        const messageContent = interaction.options.get(messageOptionLiteral).value as string;
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
                if (err.code == e["Cannot send messages to this user"]) {
                    interaction.reply(`Could not dm ${user.username}`);
                }
            })
    }

    public async execute(
        message: Message,
        { commandless2 }: literalCommandType
    ) {
        const { guild, attachments, mentions, member } = message;
        if (!member.permissions.has(requiredPerm))
            return message.reply.call(`\`\`\`{${permLiteral} permissions required\`\`\``);

        const user = mentions.users.first();
        const text = commandless2;
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
                if (err.code == e["Cannot send messages to this user"]) {
                    throw new Error(`Could not dm ${user.username}`);
                }
            })
    }

    getKeyword(): string {
        return _keyword;
    }

    getAliases(): string[] {
        return this._aliases;
    }

    getGuide(): string {
        return _guide;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}