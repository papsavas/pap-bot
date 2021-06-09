import * as Discord from 'discord.js';
import { ApplicationCommandData, ApplicationCommandOptionData, GuildMember, Snowflake, TextChannel } from "discord.js";
import { guildMap } from "../../..";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { GsimplePoll as _guide } from '../../guides.json';
import { simplePoll as _keyword } from '../../keywords.json';
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { pollCmd } from "../Interf/pollCmd";

const textOptionLiteral: ApplicationCommandOptionData['name'] = 'text';
export class PollCmdImpl extends AbstractGuildCommand implements pollCmd {

    protected _id: Snowflake;
    private constructor() { super() }

    static async init(): Promise<pollCmd> {
        const cmd = new PollCmdImpl();
        cmd._id = await fetchCommandID(_keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['poll', 'πολλ'],
            _keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide(),
            options: [
                {
                    name: textOptionLiteral,
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
                    description: interaction.options.get(textOptionLiteral).value as string,
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
                interaction.reply({
                    content: 'poll created',
                    ephemeral: true
                }).catch();
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