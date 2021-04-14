import {dmMember as _keyword} from '../keywords.json';
import {GdmMember as _guide} from '../guides.json';
import {injectable} from "inversify";
import {AbstractCommand} from "../AbstractCommand";
import {dmMemberCmd} from "../Interf/dmMemberCmd";
import * as e from '../../errorCodes.json'
import * as Discord from 'discord.js';
import {Message} from 'discord.js';
import {commandType, guildLoggerType} from "../../Entities";


@injectable()
export class DmMemberCmdImpl extends AbstractCommand implements dmMemberCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['directmessage', 'message', 'dm'],
        _keyword
    );


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