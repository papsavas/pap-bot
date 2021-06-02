
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { logChanges as _keyword } from '../../keywords.json';
import { GlogChanges as _guide } from '../../guides.json';
import { ApplicationCommandData, CommandInteraction, GuildManager, GuildMember, Message, Permissions, Snowflake } from "discord.js";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import { fetchCommandID, overrideCommandPerms } from "../../../Queries/Generic/Commands";
import { unlockCommandCmd } from "../Interf/unlockCommandCmd";
import { guildMap } from "../../..";
import { messaging } from "firebase-admin";
import { loadGuildLogs } from "../../../Queries/Generic/guildLogs";


export class ShowLogsCmdImpl extends AbstractGuildCommand implements unlockCommandCmd {

    readonly id: Snowflake = fetchCommandID(_keyword);

    private readonly _aliases = this.addKeywordToAliases
        (
            ['log', 'logs'],
            _keyword
        );

    getCommandData(): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide()
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const { guild } = interaction;
        const member = (interaction.member instanceof GuildMember) ?
            interaction.member :
            await guild.members.fetch(interaction.member.user.id);

        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
            return interaction.reply(`\`MANAGE_GUILD permissions required\``, { ephemeral: true });

        try {
            await interaction.reply('fetching logs', { ephemeral: true });
            const res = await loadGuildLogs(guild.id);
            if (res.length < 1)
                return interaction.followUp(`no logs found`, { ephemeral: true });
            let literal: string = ``;
            for (const el of res)
                literal += `${el.member_id ? `<@${el.member_id}> | ` : ``}${el.log} | ${el.date.toString()}\n`;
            return interaction.followUp(
                //last 2000 characters
                literal.slice(Math.max(literal.length - 2000, 0)),
                {
                    code: true,
                    allowedMentions: { parse: [] },
                    ephemeral: true
                }
            )
        } catch (error) {
            return console.log(error);
        }
    }

    async execute(message: Message, receivedCommand: literalCommandType): Promise<any> {
        const { member, channel, guild } = message;
        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
            return message.reply(`\`MANAGE_GUILD permissions required\``);
        else {
            const msg = await channel.send(`are you sure you want to expose __private__ actions on this channel? **(Y/N)**`)
            channel.awaitMessages(
                (msg: Message) => msg.author === member.user && ['y', 'n'].some(c => msg.cleanContent.toLowerCase() === c),
                {
                    max: 1,
                    time: 10000
                }
            )
                .then(async collected => {
                    if (collected.first().content.toLowerCase() === 'y') {
                        try {
                            const res = await loadGuildLogs(guild.id);
                            if (res.length < 1) return channel.send(`no logs found`);
                            let literal = ``;
                            for (const el of res)
                                literal += `<@${el.member_id}> | ${el.log} | ${el.date.toString}\n`;
                            return channel.send(literal.toString(),
                                { split: true, code: true, allowedMentions: { users: [], roles: [], repliedUser: false } }
                            )
                        } catch (error) {
                            return console.log(error);
                        }

                    }
                    else
                        return collected.first().react('👌');
                }
                )
                .catch(collected => { channel.send(`You didnt answer in time`) })
        }
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
