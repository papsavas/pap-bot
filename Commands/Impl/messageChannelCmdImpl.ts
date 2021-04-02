import * as Discord from 'discord.js';
import {messageChannel as _keyword} from '../keywords.json';
import {GmessageChannel as _guide} from '../guides.json';
import {injectable} from "inversify";
import Bundle from "../../EntitiesBundle/Bundle";
import {AbstractCommand} from "../AbstractCommand";
import {messageChannelCmd} from "../Interf/messageChannelCmd";

@injectable()
export class MessageChannelCmdImpl extends AbstractCommand implements messageChannelCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['send', 'msgchannel', 'messagechannel', 'message_channel'],
        _keyword
    );

    execute(bundle: Bundle) {
        if (bundle.getChannel().type == 'text') {
            const sendChannel: Discord.TextChannel | undefined = bundle.getMessage().mentions.channels.first();
            if (typeof sendChannel == 'undefined')
                return new Promise((res, rej) => rej('Channel not found'));
            else
                return sendChannel.send(bundle.getCommand().commandless2);
        } else
            return new Promise((res, rej) => rej('cannot perform messaging on a non text channel'))
    }

    getAliases(): string[] {
        return this._aliases;
    }

    getGuide(): string {
        return _guide;
    }

    getKeyword(): string {
        return _keyword;
    }
}