import { ApplicationCommandOptionData, ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData, ChatInputCommandInteraction, Collection, GuildMember, Message, MessageType, PermissionFlagsBits, Snowflake, TextChannel } from 'discord.js';
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from '../../../Queries/Generic/Commands';
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { clearMessagesCmd } from "../Interf/clearMessagesCmd";

const numberOptionLiteral: ApplicationCommandOptionData['name'] = 'number';

export class ClearMessagesCmdImpl extends AbstractGuildCommand implements clearMessagesCmd {
    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `clear`;
    readonly guide = `Deletes a provided number of recent messages`;
    readonly usage = `${this.keyword} number`;
    private constructor() { super() }

    static async init(): Promise<clearMessagesCmd> {
        const cmd = new ClearMessagesCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }


    readonly aliases = this.mergeAliases
        (
            ['clear', 'clean', 'purge'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: numberOptionLiteral,
                    description: 'number of messages to delete',
                    type: ApplicationCommandOptionType.Integer,
                    required: true

                }
            ]
        }
    }

    async interactiveExecute(interaction: ChatInputCommandInteraction): Promise<unknown> {
        const number = interaction.options.getInteger(numberOptionLiteral, true);
        const member = interaction.member as GuildMember;

        if (member.permissions.has(PermissionFlagsBits.ManageMessages)) {

            const delMessages = await (interaction.channel as TextChannel).bulkDelete(number);
            let descr = '';
            [...delMessages.values()].reverse().map(msg => {

                try {
                    if (!msg.content.startsWith('$clear') && msg.type !== MessageType.ChatInputCommand)
                        descr += `**${msg.author.username}**: ${msg.content}\n`;
                } catch (err) {
                    descr += `**${msg.author.username}**: ???\n`;
                }
            });

            return interaction.reply({
                embeds: [{
                    title: `🗑️ Deleted ${number} messages`,
                    description: descr.substring(0, 2048)
                }]
            });
        }
        else
            return interaction.reply({ content: 'You need `MANAGE_MESSAGES` permissions', ephemeral: true })

    }

    execute({ channel, member }: Message, { arg1 }: commandLiteral) {
        const number = parseInt(arg1) == 100 ?
            100 : parseInt(arg1) == 0 ?
                0 : parseInt(arg1) + 1;
        if (isNaN(number))
            return Promise.reject(new Error(`You need to provide a number between 1-100`));

        if (member.permissions.has(PermissionFlagsBits.ManageMessages))
            return (channel as TextChannel).bulkDelete(number)
                .then(delMessages => {
                    let descr = '';
                    [...delMessages.values()].reverse().map(msg => {
                        try {
                            if (!msg.content.startsWith('$clear'))
                                descr += `**${msg.author.username}**: ${msg.content}\n`;
                        } catch (err) {
                            descr += `**${msg.author.username}**: ???\n`;
                        }
                    });
                    if (descr.length > 2048) return
                    return channel.send({
                        embeds: [{
                            title: `🗑️ Deleted ${number} messages`,
                            description: descr
                        }]
                    });
                })
                .catch()
        else
            return Promise.reject('Requires `MANAGE_MESSAGES` permission')
    }
}

