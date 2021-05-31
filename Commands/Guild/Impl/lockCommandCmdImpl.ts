
import { AbstractCommand } from "../AbstractCommand";
import { lockCommand as _keyword } from '../../keywords.json';
import { GlockCommand as _guide } from '../../guides.json';
import { ApplicationCommandData, CommandInteraction, Message, Snowflake } from "discord.js";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import { lockCommandCmd } from "../Interf/lockCommandCmd";
import { fetchCommandID, overrideCommandPerms } from "../../../Queries/Generic/Commands";
import { guildMap } from "../../..";


export class LockCommandCmdImpl extends AbstractCommand implements lockCommandCmd {

    readonly id: Snowflake = fetchCommandID(_keyword);

    private readonly _aliases = this.addKeywordToAliases
        (
            ['lockcmd', 'lockcommand', 'lock_command', 'lock_cmd'],
            _keyword
        );

    getCommandData(): ApplicationCommandData {
        return {
            name: `lockCommand`,
            description: this.getGuide(),
            options: [
                {
                    name: 'command_name',
                    description: 'command name to override perms',
                    type: 'STRING',
                    required: true
                },
                {
                    name: 'role1',
                    description: 'allowed role',
                    type: 'ROLE',
                    required: true,
                },

                {
                    name: 'role2',
                    description: 'allowed role',
                    type: 'ROLE',
                    required: false
                },

                {
                    name: 'role3',
                    description: 'allowed role',
                    type: 'ROLE',
                    required: false
                },
                {
                    name: 'role4',
                    description: 'allowed role',
                    type: 'ROLE',
                    required: false
                },

            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const guild_id = interaction.guildID;
        const filteredRoles = interaction.options.filter(option => option.role);
        const rolesKeyArr = filteredRoles.map(filteredOptions => filteredOptions.role.id);
        const command_id = interaction.options[0].value as string; //cannot retrieve command from aliases, must be exact
        await interaction.defer({ ephemeral: true });
        await overrideCommandPerms(guild_id, command_id, [...new Set(rolesKeyArr)]);
        return interaction.editReply(`Command ${command_id} locked for ${filteredRoles.map(ro => ro.role).toString()}`);
    }

    execute(receivedMessage: Message, receivedCommand: literalCommandType): Promise<any> {
        const guild_id = receivedMessage.guild.id;
        const rolesKeyArr = receivedMessage.mentions.roles.keyArray();
        const command_id = receivedCommand.arg1; //cannot retrieve command from aliases, must be exact
        return overrideCommandPerms(guild_id, command_id, [...new Set(rolesKeyArr)]);
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
