
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { lockCommand as _keyword } from '../../keywords.json';
import { GlockCommand as _guide } from '../../guides.json';
import { ApplicationCommandData, ApplicationCommandOptionChoice, ApplicationCommandOptionData, CommandInteraction, Message, Snowflake } from "discord.js";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import { lockCommandCmd } from "../Interf/lockCommandCmd";
import { fetchCommandID, overrideCommandPerms } from "../../../Queries/Generic/Commands";
import { guildMap } from "../../..";

const cmdOptionLiteral: ApplicationCommandOptionData['name'] = 'command_name';
export class LockCommandCmdImpl extends AbstractGuildCommand implements lockCommandCmd {

    readonly id: Snowflake = fetchCommandID(_keyword);

    private readonly _aliases = this.addKeywordToAliases
        (
            ['lockcmd', 'lockcommand', 'lock_command', 'lock_cmd'],
            _keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        let choices: ApplicationCommandOptionChoice[];
        (async function () {
            const cmds = await guildMap.get(guild_id).fetchCommands();
            choices = cmds.map(cmd => Object.assign({}, { name: cmd.name, value: cmd.name }))
        }())
        return {
            name: _keyword,
            description: this.getGuide(),
            options: [
                {
                    name: cmdOptionLiteral,
                    description: 'command name to override perms',
                    type: 'STRING',
                    required: true,
                    choices: choices
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
                {
                    name: 'role5',
                    description: 'allowed role',
                    type: 'ROLE',
                    required: false
                },
            ],
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const guild_id = interaction.guildID;
        const filteredRoles = interaction.options.filter(option => option.type == "ROLE");
        const rolesKeyArr = filteredRoles.map(filteredOptions => filteredOptions.role.id);
        const command_literal = interaction.options[0]?.value as string; //cannot retrieve command from aliases, must be exact
        if (!command_literal)
            return interaction.reply(`invalid command ${JSON.stringify(interaction.options[0])}`);
        await interaction.defer({ ephemeral: true });
        await overrideCommandPerms(guild_id, command_literal, [...new Set(rolesKeyArr)]);
        return interaction.editReply(`Command ${command_literal} locked for ${filteredRoles.map(ro => ro.role).toString()}`);
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
