import * as Discord from 'discord.js';
import {Message} from 'discord.js';
import {messageChannel as _keyword} from '../keywords.json';
import {GmessageChannel as _guide} from '../guides.json';
import {injectable} from "inversify";
import {AbstractCommand} from "../AbstractCommand";
import {messageChannelCmd} from "../Interf/messageChannelCmd";
import {commandType} from "../../Entities/Generic/commandType";
import {guildLoggerType} from "../../Entities/Generic/guildLoggerType";

@injectable()
export class MessageChannelCmdImpl extends AbstractCommand implements messageChannelCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['send', 'msgchannel', 'messagechannel', 'message_channel'],
        _keyword
    );

    async execute({guild, mentions}: Message, {commandless2}: commandType, addGuildLog: guildLoggerType) {
        const sendChannel: Discord.TextChannel | undefined = mentions.channels.first();
        if (guild.channels.cache.has(sendChannel?.id) && sendChannel?.type === 'text')
            return sendChannel.send(commandless2)
                .then(() => addGuildLog(`sent ${commandless2} to ${sendChannel.name}`));
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