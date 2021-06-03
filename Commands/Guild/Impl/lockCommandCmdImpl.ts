
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { lockCommand as _keyword } from '../../keywords.json';
import { GlockCommand as _guide } from '../../guides.json';
import { ApplicationCommandData, ApplicationCommandOptionChoice, ApplicationCommandOptionData, ApplicationCommandPermissions, CommandInteraction, Message, Snowflake } from "discord.js";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import { lockCommandCmd } from "../Interf/lockCommandCmd";
import { fetchCommandID, overrideCommandPerms } from "../../../Queries/Generic/Commands";
import { guildMap } from "../../..";

const cmdOptionLiteral: ApplicationCommandOptionData['name'] = 'command_name';

export class LockCommandCmdImpl extends AbstractGuildCommand implements lockCommandCmd {

    readonly _id: Snowflake = fetchCommandID(_keyword);

    private readonly _aliases = this.addKeywordToAliases
        (
            ['lockcmd', 'lockcommand', 'lock_command', 'lock_cmd'],
            _keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide(),
            options: [
                {
                    name: cmdOptionLiteral,
                    description: 'command name to override perms',
                    type: 'STRING',
                    required: true,
                    choices: guildMap.get(guild_id).commandHandler.commands
                        .map(cmd => Object.assign({}, { name: cmd.getKeyword(), value: cmd.getKeyword() }))
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
        const commandLiteral = interaction.options.get(cmdOptionLiteral).value as string;
        const command_id: Snowflake = guildMap.get(guild_id).commandHandler.commands
            .find(cmd => cmd.matchAliases(commandLiteral))?.id
        await interaction.defer({ ephemeral: true });
        await overrideCommandPerms(guild_id, command_id, [...new Set(rolesKeyArr)]);
        return interaction.editReply(`Command ${commandLiteral} locked for ${filteredRoles.map(ro => ro.role).toString()}`);
    }

    async execute(receivedMessage: Message, receivedCommand: literalCommandType): Promise<any> {
        const guild_id = receivedMessage.guild.id;
        const rolesKeyArr: Snowflake[] = receivedMessage.mentions.roles.keyArray();
        const commandLiteral = receivedCommand.arg1; //cannot retrieve command from aliases, must be exact
        const command_id: Snowflake = guildMap.get(guild_id).commandHandler.commands
            .find(cmd => cmd.matchAliases(commandLiteral))?.id
        if (!command_id)
            return receivedMessage.reply(`command ${commandLiteral} not found`);
        /*
         * override perms for manual command in DB
         */
        await overrideCommandPerms(guild_id, command_id, [...new Set(rolesKeyArr)]);

        /**
         * override perms for interaction
         */
        return receivedMessage.guild.commands.setPermissions(command_id,
            [...new Set(rolesKeyArr)].map(id => Object.assign({}, {
                id: id,
                type: 'ROLE',
                permission: true
            })) as ApplicationCommandPermissions[]);
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
