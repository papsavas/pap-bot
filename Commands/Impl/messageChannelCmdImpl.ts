import {injectable} from "inversify";
import * as Discord from 'discord.js';
import {AbstractCommand} from "@Commands/AbstractCommand";
import {messageChannelCmd} from "@cmdInterfaces/messageChannelCmd";
import Bundle from "@root/EntitiesBundle/Bundle";
import { messageChannel as _keyword } from '@Commands/keywords.json';
import { GmessageChannel as _guide } from '@Commands/guides.json';

@injectable()
export class MessageChannelCmdImpl extends AbstractCommand implements messageChannelCmd {
    private readonly  _aliases :string[] = ['send', 'msgchannel', 'messagechannel', 'message_channel'];

    execute(bundle: Bundle){
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