import { AbstractCommand } from "../AbstractCommand";
import * as Discord from 'discord.js';
import { simplePoll as _keyword } from '../../keywords.json';
import { GsimplePoll as _guide } from '../../guides.json';

import { pollCmd } from "../Interf/pollCmd";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import { ApplicationCommandData, GuildMember, Snowflake, TextChannel } from "discord.js";
import { guildMap } from "../../..";
import { fetchCommandID } from "../../../Queries/Generic/Commands";



export class PollCmdImpl extends AbstractCommand implements pollCmd {

    readonly id: Snowflake = fetchCommandID(_keyword);

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

    async interactiveExecute(interaction: Discord.CommandInteraction): Promise<any> {
        const channel = interaction.channel as TextChannel;
        const member = interaction.member as GuildMember;
        return channel.send(
            new Discord.MessageEmbed(
                {
                    title: `Vote`,
                    color: '#D8F612',
                    description: interaction.options[0].value as string,
                    author: {
                        name: member.displayName,
                        icon_url: member.user.avatarURL({ format: 'png' })
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
                interaction.reply('poll created', { ephemeral: true }).catch();
            })
            .catch(err => interaction.reply(`something went wrong`))
    }


    execute(message: Discord.Message, { commandless1 }: literalCommandType) {
        const commandMsg = message;
        return (commandMsg.channel as Discord.TextChannel).send(
            new Discord.MessageEmbed(
                {
                    title: `Ψηφίστε`,
                    color: '#D8F612',
                    description: commandless1,
                    author: {
                        name: commandMsg.member.displayName,
                        icon_url: commandMsg.member.user.avatarURL({ format: 'png' })
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
                if (commandMsg.deletable)
                    commandMsg.delete()
                        .catch(err => {
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

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}