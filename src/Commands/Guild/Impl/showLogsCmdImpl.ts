
import { ChatInputApplicationCommandData, Collection, CommandInteraction, GuildMember, Message, Permissions, Snowflake } from "discord.js";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { loadGuildLogs } from "../../../Queries/Generic/guildLogs";
import { sliceToEmbeds } from "../../../tools/Embed";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { showLogsCmd } from "../Interf/showLogsCmd";

/**
 * @deprecated
 */
export class ShowLogsCmdImpl extends AbstractGuildCommand implements showLogsCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `logs`;
    readonly guide = `Prints guilds logs`;
    readonly usage = `${this.keyword}`;

    private constructor() { super() }

    static async init(): Promise<showLogsCmd> {
        const cmd = new ShowLogsCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    readonly aliases = this.mergeAliases
        (
            ['log', 'logs'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const { guild } = interaction;
        const member = (interaction.member instanceof GuildMember) ?
            interaction.member :
            await guild.members.fetch(interaction.member.user.id);

        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
            return interaction.reply({
                content: `\`MANAGE_GUILD permissions required\``,
                ephemeral: true
            });

        try {
            await interaction.reply({
                content: 'fetching logs',
                ephemeral: true
            });
            const res = await loadGuildLogs(guild.id);
            if (res.length < 1)
                return interaction.followUp({
                    content: `no logs found`,
                    ephemeral: true
                });

            const embs = sliceToEmbeds({
                data: res.reverse().map((el, i) => ({ name: el.date.toDateString() ?? `**${i}.**`, value: `<@${el.member_id}> | ${el.log}` })),
                headerEmbed: {
                    title: `Logs`
                },
                size: 5
            })
            return interaction.followUp({
                embeds: embs,
                allowedMentions: { parse: [] },
                ephemeral: true
            }
            )
        } catch (error) {
            return console.log(error);
        }
    }

    async execute(message: Message, receivedCommand: commandLiteral): Promise<any> {
        const { member, channel, guild } = message;
        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
            return message.reply(`\`MANAGE_GUILD permissions required\``);
        else {
            const msg = await channel.send(`are you sure you want to expose __private__ actions on this channel? **(Y/N)**`)
            const filter = (msg: Message) => msg.author === member.user && ['y', 'n'].some(c => msg.cleanContent.toLowerCase() === c);
            channel.awaitMessages(
                {
                    filter,
                    max: 1,
                    time: 10000
                }
            )
                .then(async collected => {
                    if (collected.first().content.toLowerCase() === 'y') {
                        try {
                            const res = await loadGuildLogs(guild.id);
                            if (res.length < 1) return channel.send(`no logs found`);
                            const embs = sliceToEmbeds({
                                data: res
                                    .reverse() //show latest logs first
                                    .map((el, i) => ({ name: el.date.toDateString() ?? `**${i}.**`, value: `<@${el.member_id}> | ${el.log}` })),
                                headerEmbed: {
                                    title: `Logs`
                                },
                                size: 5
                            })
                            return channel.send({
                                embeds: embs,
                                allowedMentions: {
                                    users: [],
                                    roles: [],
                                    repliedUser: false
                                }
                            }
                            )
                        } catch (error) {
                            return console.log(error);
                        }

                    }
                    else
                        return collected.first().react('👌');
                }
                )
                .catch(err => {
                    console.log(err.toString());
                    channel.send(`You didnt answer in time`)
                })
        }
    }





}
