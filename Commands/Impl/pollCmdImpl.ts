import { AbstractCommand } from "../AbstractCommand";
import * as Discord from 'discord.js';
import { simplePoll as pollKeyword } from '../keywords.json';
import { GsimplePoll } from '../guides.json';
import { pollCmd } from "../Interf/pollCmd";
import { injectable } from "inversify";
import "reflect-metadata";
import Bundle from "../../EntitiesBundle/Bundle";

@injectable()
export class PollCmdImpl extends AbstractCommand implements pollCmd {
    private readonly aliases = ['poll', 'πολλ'];
    execute(bundle: Bundle) {
        (bundle.getChannel() as Discord.TextChannel | Discord.DMChannel).send(
            new Discord.MessageEmbed(
                {
                    title: `Ψηφίστε`,
                    color: '#D8F612',
                    description: bundle.getCommand().commandless1,
                    author: {
                        name: bundle.getMember().displayName,
                        icon_url: bundle.getUser().avatarURL({ format: 'png' })
                    },
                    //add blank
                    fields: [{
                        name: '\u200B',
                        value: '\u200B',
                    },],

                    footer: { text: 'Poll📊' }
                }))
            .then((botmsg) => {
                botmsg.react('👍');
                botmsg.react('👎');
                bundle.getMessage().delete().catch(err => console.log(err));
            }).catch(err => console.log(err));
    }

    getKeyword(): string {
        return pollKeyword
    }
    getAliases(): string[] {
        return this.aliases
    }

    getGuide(): string {
        return GsimplePoll;
    }
}