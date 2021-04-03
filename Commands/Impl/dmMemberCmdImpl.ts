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


    public execute(bundle: Bundle) {
        const message = bundle.getMessage();
        const guild = message.guild;
        const user = message.mentions.users.first();
        const text = bundle.getCommand().commandless2;
        const sendEmb = new Discord.MessageEmbed({
            author:{
                name: guild.name,
                //icon_url: `https://www.theindianwire.com/wp-content/uploads/2020/11/Google_Messages_logo.png`,
                //https://upload.wikimedia.org/wikipedia/commons/0/05/Google_Messages_logo.svg
            },
            title:`You have a message ${user.username}`,
            thumbnail: {url:guild.iconURL({format:"png", size:128})},
            color:"NAVY",
            description: text,
            timestamp : new Date()
        })
        return user.send(sendEmb)
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