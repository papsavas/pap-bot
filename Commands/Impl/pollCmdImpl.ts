import {AbstractCommand} from "../AbstractCommand";
import * as Discord from 'discord.js';
import {simplePoll as _keyword} from '../keywords.json';
import {GsimplePoll as _guide} from '../guides.json';
import {injectable} from "inversify";
import Bundle from "../../EntitiesBundle/Bundle";
import {pollCmd} from "../Interf/pollCmd";


@injectable()
export class PollCmdImpl extends AbstractCommand implements pollCmd {
    private readonly _aliases = this.addKeywordToAliases
    (
        ['poll', 'πολλ'],
        _keyword
    );


    execute(bundle: Bundle) {
        const commandMsg = bundle.getMessage();
        return (commandMsg.channel as Discord.TextChannel | Discord.DMChannel).send(
            new Discord.MessageEmbed(
                {
                    title: `Ψηφίστε`,
                    color: '#D8F612',
                    description: bundle.getCommand().commandless1,
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
                        this.handleError(err, bundle);
                    });
                return new Promise((resolve) => {
                    resolve('poll cmd executed');
                });

            }).catch(err => {
            return new Promise((resolve, reject) => {
                reject(`poll cmd failed:\n${err}`);
                this.handleError(err, bundle);
            });
        });

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