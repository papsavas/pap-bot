import {AbstractCommand} from "../AbstractCommand";
import * as Discord from 'discord.js';
import {simplePoll as _keyword} from '../keywords.json';
import {GsimplePoll as _guide} from '../guides.json';
import {pollCmd} from "../Interf/pollCmd";
import {injectable} from "inversify";
import "reflect-metadata";
import Bundle from "../../EntitiesBundle/Bundle";

@injectable()
export class PollCmdImpl extends AbstractCommand implements pollCmd {
    private _aliases;

    public constructor() {
        super(['poll', 'πολλ'],
            _keyword);
    }

    execute(bundle: Bundle) {
        (bundle.getChannel() as Discord.TextChannel | Discord.DMChannel).send(
            new Discord.MessageEmbed(
                {
                    title: `Ψηφίστε`,
                    color: '#D8F612',
                    description: bundle.getCommand().commandless1,
                    author: {
                        name: bundle.getMember().displayName,
                        icon_url: bundle.getUser().avatarURL({format: 'png'})
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
                bundle.getMessage().delete().catch(err => this.handleError(err, bundle));

                return new Promise((resolve) => {
                    resolve('poll cmd executed');
                });

            }).catch(err => {
            return new Promise((resolve, reject) => {
                reject(`poll cmd failed:\n${err}`);
                this.handleError(err, bundle);
            });
        });

        return new Promise((resolve, reject) => {
            reject(`poll sent but didn't received promise from sent message`)
        });
    }

    setAliases(aliases: string[]) {
        this._aliases = aliases;
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