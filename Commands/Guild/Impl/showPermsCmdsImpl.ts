import { ApplicationCommandData, CommandInteraction, Message, MessageEmbed, Snowflake } from 'discord.js';
import { showPerms as _keyword } from '../../keywords.json';
import { GshowPerms as _guide } from '../../guides.json';

import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import { showPermsCmd } from "../Interf/showPermsCmd";
import { fetchCommandID, fetchCommandPerms } from "../../../Queries/Generic/Commands";
import { guildMap } from "../../../index";
import { fetchAllOnCondition } from "../../../DB/CoreRepo";


export class ShowPermsCmdsImpl extends AbstractGuildCommand implements showPermsCmd {

    readonly id: Snowflake = fetchCommandID(_keyword);

    private readonly _aliases = this.addKeywordToAliases
        (
            ['perms', 'perm', 'showperms', 'show_perms'],
            _keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide(),
            options: [
                {
                    name: 'command',
                    description: 'permissions for command',
                    type: 'STRING',
                    required: true
                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const command_id = interaction.options[0].value as string;
        const guild_prefix = guildMap.get(interaction.guildID).getSettings().prefix;
        await interaction.defer({ ephemeral: true });
        const commandPerms = await fetchCommandPerms(interaction.guildID, command_id);
        const reqRoles = await Promise.all(commandPerms.map(cp => interaction.guild.roles.fetch(cp.role_id)))
        return interaction.editReply(new MessageEmbed({
            title: guild_prefix + command_id,
            description: `Enabled for : ${reqRoles.toString()}`,
        }));
    }

    async execute(message: Message, { arg1 }: literalCommandType) {
        const command_id = arg1;
        const guild_prefix = guildMap.get(message.guild.id).getSettings().prefix;
        const commandPerms = await fetchCommandPerms(message.guild.id, command_id);
        return Promise.all(commandPerms.map(cp => message.guild.roles.fetch(cp.role_id)))
            .then(reqRoles =>
                message.reply(new MessageEmbed({
                    title: guild_prefix + command_id,
                    description: `Enabled for : ${reqRoles.toString()}`,
                }))
            );
    }

    getAliases(): string[] {
        return this._aliases;
    }

    getGuide(): string {
        return _guide;
    }

    getKeyword(): string {
        return _keyword;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}