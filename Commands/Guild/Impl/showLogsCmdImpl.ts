
import { AbstractCommand } from "../AbstractCommand";
import { logChanges as _keyword } from '../../keywords.json';
import { GlogChanges as _guide } from '../../guides.json';
import { ApplicationCommandData, CommandInteraction, Message, Permissions, Snowflake } from "discord.js";
import { commandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import { overrideCommandPerms } from "../../../Queries/Generic/guildRolePerms";
import { unlockCommandCmd } from "../Interf/unlockCommandCmd";
import { guildMap } from "../../..";
import { messaging } from "firebase-admin";
import { loadGuildLogs } from "../../../Queries/Generic/guildLogs";


export class ShowLogsCmdImpl extends AbstractCommand implements unlockCommandCmd {
    private readonly _aliases = this.addKeywordToAliases
        (
            ['log', 'logs'],
            _keyword
        );

    getCommandData(): ApplicationCommandData {
        return {
            name: `logs`,
            description: this.getGuide()
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {

    }

    async execute({ member, reply, channel, guild }: Message, receivedCommand: commandType): Promise<any> {
        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
            return reply(`\`MANAGE_GUILD permissions required\``);
        else {
            const msg = await channel.send(`are you sure you want to expose private actions on this channel? (Y/N)`)
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
                            return channel.send(literal,
                                { split: true, allowedMentions: { users: [], roles: [], repliedUser: false } }
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
