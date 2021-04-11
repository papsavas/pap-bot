import * as Discord from 'discord.js';
import {messageChannel as _keyword} from '../keywords.json';
import {GmessageChannel as _guide} from '../guides.json';
import {injectable} from "inversify";
import Bundle from "../../BundlePackage/Bundle";
import {AbstractCommand} from "../AbstractCommand";
import {messageChannelCmd} from "../Interf/messageChannelCmd";

@injectable()
export class MessageChannelCmdImpl extends AbstractCommand implements messageChannelCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['send', 'msgchannel', 'messagechannel', 'message_channel'],
        _keyword
    );

    async execute(bundle: Bundle) {
        const command = bundle.getCommand();
        const message = bundle.getMessage();
        const sendChannel: Discord.TextChannel | undefined = message.mentions.channels.first();
        if(message.guild.channels.cache.has(sendChannel.id) && sendChannel?.type === 'text')
            return sendChannel.send(command.commandless2)
                .then((msg) => bundle.addLog(`sent ${command.commandless2} to ${sendChannel.name}`));
        else
            throw new Error(`Channel not found`);
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