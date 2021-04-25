import {clearMessages as _keyword} from '../../keywords.json';
import {GclearMessages as _guide} from '../../guides.json';
import {injectable} from "Inversify";
import {AbstractCommand} from "../AbstractCommand";
import {Message, Permissions, TextChannel} from 'discord.js';
import {commandType} from "../../../Entities/Generic/commandType";
import {guildLoggerType} from "../../../Entities/Generic/guildLoggerType";
import {clearMessagesCmd} from "../Interf/clearMessagesCmd";


@injectable()
export class ClearMessagesCmdImpl extends AbstractCommand implements clearMessagesCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['clear', 'clean', 'purge'],
        _keyword
    );


    public execute({channel, member}: Message, {arg1}: commandType, addGuildLog: guildLoggerType) {
        const number = parseInt(arg1) == 100 ?
            100 : parseInt(arg1) == 0 ?
                0 : parseInt(arg1) +1;
        if(isNaN(number))
            return Promise.reject(new Error(`You need to provide a number between 1-100`));

        if (member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES))
            return (channel as TextChannel).bulkDelete(number)
                .then(delMessages => {
                    //addGuildLog(`${member.displayName} deleted ${number} messages in ${(channel as TextChannel).name}`);
                    let descr = '';
                    delMessages.array()/*.slice(1)*/.reverse().map(msg => {
                        try {
                            if (!msg.content.startsWith('$clear'))
                                descr += `**${msg.author.username}**: ${msg.content}\n`;
                        } catch (err) {
                            descr += `**${msg.author.username}**: ???\n`;
                        }
                    });
                    if (descr.length > 2048) return
                    return channel.send({
                        embed: {
                            title: `🗑️ Deleted ${number} messages`,
                            description: descr
                        }
                    });
                })
                .catch()
        else
            return Promise.reject('Requires `MANAGE_MESSAGES` permission')
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