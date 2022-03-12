import { ApplicationCommandOptionData, ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData, ChatInputCommandInteraction, Collection, Colors, Embed, GuildMember, Message, Snowflake, TextChannel } from "discord.js";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { pollCmd } from "../Interf/pollCmd";

const textOptionLiteral: ApplicationCommandOptionData['name'] = 'text';
export class PollCmdImpl extends AbstractGuildCommand implements pollCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `poll`;
    readonly guide = `Creates a simple poll using 👍-👎`;
    readonly usage = `${this.keyword} <text>`;
    private constructor() { super() }

    static async init(): Promise<pollCmd> {
        const cmd = new PollCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    readonly aliases = this.mergeAliases
        (
            ['poll', 'πολλ'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: textOptionLiteral,
                    description: 'text to poll',
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        }
    }

    async interactiveExecute(interaction: ChatInputCommandInteraction): Promise<any> {
        const channel = interaction.channel as TextChannel;
        const member = interaction.member as GuildMember;
        return channel.send({
            embeds: [
                new Embed(
                    {
                        title: `Vote`,
                        color: Colors.Yellow,
                        description: interaction.options.getString(textOptionLiteral, true),
                        author: {
                            name: member.displayName,
                            icon_url: member.user.avatarURL({ extension: 'png' })
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

    execute(message: Message, { args1 }: commandLiteral) {
        const commandMsg = message;
        return (commandMsg.channel as TextChannel).send({
            embeds: [
                new Embed(
                    {
                        title: `Ψηφίστε`,
                        color: Colors.Yellow,
                        description: args1,
                        author: {
                            name: commandMsg.member.displayName,
                            icon_url: commandMsg.member.user.avatarURL({ extension: 'png' })
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
            })
    }




}