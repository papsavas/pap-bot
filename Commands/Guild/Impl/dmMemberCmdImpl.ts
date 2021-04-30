import {dmMember as _keyword} from '../../keywords.json';
import {GdmMember as _guide} from '../../guides.json';
import {injectable} from "Inversify";
import {AbstractCommand} from "../AbstractCommand";
import {dmMemberCmd} from "../Interf/dmMemberCmd";
import * as e from '../../../errorCodes.json'
import * as Discord from 'discord.js';
import {ApplicationCommandData, Message, User} from 'discord.js';
import {commandType} from "../../../Entities/Generic/commandType";
import {guildLoggerType} from "../../../Entities/Generic/guildLoggerType";


@injectable()
export class DmMemberCmdImpl extends AbstractCommand implements dmMemberCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['directmessage', 'message', 'dm'],
        _keyword
    );
    
    getCommandData(): ApplicationCommandData {
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
                    name: 'message',
                    description: 'message to user',
                    type: 'STRING',
                    required: true
                }
            ]
        }
    }

    async interactiveExecute(interaction: Discord.CommandInteraction): Promise<any>{
        const user = interaction.options[0].user;
        const messageContent = interaction.options[1].value as string;
        const sendEmb = new Discord.MessageEmbed({
            author: {
                name: interaction.guild.name,
                //icon_url: `https://www.theindianwire.com/wp-content/uploads/2020/11/Google_Messages_logo.png`,
                //https://upload.wikimedia.org/wikipedia/commons/0/05/Google_Messages_logo.svg
            },
            title: `You have a message ${user.username}`,
            thumbnail: {url: interaction.guild.iconURL({format: "png", size: 128})},
            color: "AQUA",
            description: messageContent,
            //video: { url: attachments?.proxyURL}, cannot send video via rich embed
            timestamp: new Date()
        })
        return user.send(sendEmb)
            .then((smsg) => interaction.reply(`message send to ${user.toString()}`, {ephemeral:true}))
            .catch(err => {
                if (err.code == e["Cannot send messages to this user"]) {
                   interaction.reply(`Could not dm ${user.username}`);
                }
            })
    }

    public async execute(
        {guild, attachments, mentions}: Message,
        {commandless2}: commandType,
        addGuildLog: guildLoggerType
    ) {
        const user = mentions.users.first();
        const text = commandless2;
        if (!text && !attachments)
            throw new Error('Cannot send empty message');

        const sendEmb = new Discord.MessageEmbed({
            author: {
                name: guild.name,
                //icon_url: `https://www.theindianwire.com/wp-content/uploads/2020/11/Google_Messages_logo.png`,
                //https://upload.wikimedia.org/wikipedia/commons/0/05/Google_Messages_logo.svg
            },
            title: `You have a message ${user.username}`,
            thumbnail: {url: guild.iconURL({format: "png", size: 128})},
            image: {url: attachments?.first().url},
            color: "AQUA",
            description: text,
            //video: { url: attachments?.proxyURL}, cannot send video via rich embed
            timestamp: new Date()
        })
        return user.send(sendEmb)
            .then((smsg) => addGuildLog(`sent "${text}" to ${user.username}`))
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
}