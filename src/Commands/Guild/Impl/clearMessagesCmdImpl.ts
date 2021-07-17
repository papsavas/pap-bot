import { ApplicationCommandData, ApplicationCommandOptionData, CommandInteraction, GuildMember, Message, Permissions, Snowflake, TextChannel } from 'discord.js';
import { commandLiteral } from "../../../Entities/Generic/command";
import { guildMap } from '../../../index';
import { fetchCommandID } from '../../../Queries/Generic/Commands';
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { clearMessagesCmd } from "../Interf/clearMessagesCmd";

const numberOptionLiteral: ApplicationCommandOptionData['name'] = 'number';

export class ClearMessagesCmdImpl extends AbstractGuildCommand implements clearMessagesCmd {
    protected _id: Snowflake;
    protected _keyword = `clear`;
    protected _guide = `Deletes a provided number of recent messages`;
    protected _usage = `$clear number`;
    private constructor() { super() }

    static async init(): Promise<clearMessagesCmd> {
        const cmd = new ClearMessagesCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }


    private readonly _aliases = this.addKeywordToAliases
        (
            ['clear', 'clean', 'purge'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            options: [
                {
                    name: numberOptionLiteral,
                    description: 'number of messages to delete',
                    type: 'INTEGER',
                    required: true

                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const number = interaction.options.get(numberOptionLiteral).value as number;
        const member = interaction.member as GuildMember;

        if (member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {

            const delMessages = await (interaction.channel as TextChannel).bulkDelete(number);
            //addGuildLog(`${member.displayName} deleted ${number} messages in ${(channel as TextChannel).name}`);
            let descr = '';
            delMessages.array()/*.slice(1)*/.reverse().map(msg => {

                try {
                    if (!msg.content.startsWith('$clear') && msg.type !== 'APPLICATION_COMMAND')
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

        if (member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES))
            return (channel as TextChannel).bulkDelete(number)
                .then(delMessages => {
                    //addGuildLog(`${member.displayName} deleted ${number} messages in ${(channel as TextChannel).name}`);
                    let descr = '';
                    delMessages.array()/*.slice(1)*/.reverse().map(msg => {
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

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}

