import {AbstractCommand} from "../AbstractCommand";
import * as Discord from 'discord.js';
import {simplePoll as _keyword} from '../../keywords.json';
import {GsimplePoll as _guide} from '../../guides.json';
import {injectable} from "Inversify";
import {pollCmd} from "../Interf/pollCmd";
import {commandType} from "../../../Entities/Generic/commandType";
import {guildLoggerType} from "../../../Entities/Generic/guildLoggerType";
import { ApplicationCommandData } from "discord.js";


@injectable()
export class PollCmdImpl extends AbstractCommand implements pollCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['poll', 'πολλ'],
        _keyword
    );

    getCommandData(): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide(),
            options: [
                {
                    name: 'text',
                    description: 'text to poll',
                    type: 'STRING',
                    required: true
                }
            ]
        }
    }


    execute(message, {commandless1}: commandType, addGuildLog: guildLoggerType) {
        const commandMsg = message;
        return (commandMsg.channel as Discord.TextChannel).send(
            new Discord.MessageEmbed(
                {
                    title: `Ψηφίστε`,
                    color: '#D8F612',
                    description: commandless1,
                    author: {
                        name: commandMsg.member.displayName,
                        icon_url: commandMsg.member.user.avatarURL({format: 'png'})
                    },
                    //add blank
                    fields: [{
                        name: '\u200B',
                        value: '\u200B',
                    },],

                    footer: {text: 'Poll📊'}
                }))
            .then((botmsg) => {
                botmsg.react('👍');
                botmsg.react('👎');
                if(commandMsg.deletable)
                    commandMsg.delete()
                    .catch(err =>{
                        //this.logErrorOnBugsChannel(err, bundle);
                    });
            })
    }

    getKeyword(): string {
        return _keyword
    }

    getAliases(): string[] {
        return this._aliases
    }

    getGuide(): string {
        return _guide;
    }
}