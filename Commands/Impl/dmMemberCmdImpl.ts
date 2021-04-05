import {dmMember as _keyword} from '../keywords.json';
import {GdmMember as _guide} from '../guides.json';
import {injectable} from "inversify";
import Bundle from "../../EntitiesBundle/Bundle";
import {AbstractCommand} from "../AbstractCommand";
import {dmMemberCmd} from "../Interf/dmMemberCmd";
import * as e from '../../errorCodes.json'
import * as Discord from 'discord.js';


@injectable()
export class DmMemberCmdImpl extends AbstractCommand implements dmMemberCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['directmessage', 'message', 'dm'],
        _keyword
    );


    public async execute(bundle: Bundle) {
        const message = bundle.getMessage();
        const attachments = message.attachments?.first();
        const guild = message.guild;
        const user = message.mentions.users.first();
        const text = bundle.getCommand().commandless2;
        if(!text && !attachments)
            throw new Error('Cannot send empty message');

        const sendEmb = new Discord.MessageEmbed({
            author: {
                name: guild.name,
                //icon_url: `https://www.theindianwire.com/wp-content/uploads/2020/11/Google_Messages_logo.png`,
                //https://upload.wikimedia.org/wikipedia/commons/0/05/Google_Messages_logo.svg
            },
            title: `You have a message ${user.username}`,
            thumbnail: {url: guild.iconURL({format: "png", size: 128})},
            image: {url: attachments?.proxyURL},
            color: "AQUA",
            description: text,
            //video: { url: attachments?.proxyURL}, cannot send video via rich embed
            timestamp: new Date()
        })
        return user.send(sendEmb)
            .then((smsg) => bundle.addLog(`sent "${text}" to ${user.username}`))
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