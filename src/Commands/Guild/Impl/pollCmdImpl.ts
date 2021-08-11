import { ApplicationCommandData, ApplicationCommandOptionData, CommandInteraction, GuildMember, Message, MessageEmbed, Snowflake, TextChannel } from "discord.js";
import { commandLiteral } from "../../../Entities/Generic/command";
import { guildMap } from "../../../index";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { pollCmd } from "../Interf/pollCmd";

const textOptionLiteral: ApplicationCommandOptionData['name'] = 'text';
export class PollCmdImpl extends AbstractGuildCommand implements pollCmd {

    protected _id: Snowflake;
    protected _keyword = `poll`;
    protected _guide = `Creates a simple poll using 👍-👎`;
    protected _usage = `poll <text>`;
    private constructor() { super() }

    static async init(): Promise<pollCmd> {
        const cmd = new PollCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['poll', 'πολλ'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
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

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const channel = interaction.channel as TextChannel;
        const member = interaction.member as GuildMember;
        return channel.send({
            embeds: [
                new MessageEmbed(
                    {
                        title: `Vote`,
                        color: '#D8F612',
                        description: interaction.options.getString(textOptionLiteral, true),
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
                    })
            ]
        })
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

    execute(message: Message, { commandless1 }: commandLiteral) {
        const commandMsg = message;
        return (commandMsg.channel as TextChannel).send({
            embeds: [
                new MessageEmbed(
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
                    })
            ]
        })
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

    getAliases(): string[] {
        return this._aliases
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}