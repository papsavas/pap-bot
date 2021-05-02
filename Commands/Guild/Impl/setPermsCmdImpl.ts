import { injectable } from "inversify";
import { AbstractCommand } from "../AbstractCommand";
import { setPerms as _keyword } from '../../keywords.json';
import { GsetPerms as _guide } from '../../guides.json';
import { ApplicationCommandData, CommandInteraction, Message } from "discord.js";
import { commandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import { setPermsCmd } from "../Interf/setPermsCmd";
import { overrideCommandPerms } from "../../../Queries/Generic/guildRolePerms";

@injectable()
export class SetPermsCmdImpl extends AbstractCommand implements setPermsCmd {
    private readonly _aliases = this.addKeywordToAliases
        (
            ['setPerms', 'setperms', 'set_perms'],
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
                    choices: [

                    ]
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

            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const guild_id = interaction.guildID;
        const filteredRoles = interaction.options.filter(option => option.role);
        const rolesKeyArr = filteredRoles.map(filteredOptions => filteredOptions.role.id);
        const command_id = interaction.options[0].value as string; //cannot retrieve command from aliases, must be exact
        await interaction.defer(true);
        await overrideCommandPerms(guild_id, command_id, [...new Set(rolesKeyArr)]);
        return interaction.reply(`Command ${command_id} overriden`, { ephemeral: true });
    }

    execute(receivedMessage: Message, receivedCommand: commandType, addGuildLog: guildLoggerType): Promise<any> {
        const guild_id = receivedMessage.guild.id;
        const rolesKeyArr = receivedMessage.mentions.roles.keyArray();
        if (receivedMessage.mentions.everyone)
            rolesKeyArr.push(guild_id);
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

}
