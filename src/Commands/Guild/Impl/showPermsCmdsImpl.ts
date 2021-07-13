import {
    ApplicationCommandData, ApplicationCommandOptionData, APIErrors,
    CommandInteraction, Message, MessageEmbed, Snowflake, Constants, ApplicationCommandPermissions
} from 'discord.js';
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildMap } from "../../../index";
import { fetchCommandID, fetchCommandPerms } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { showPermsCmd } from "../Interf/showPermsCmd";


const cmdOptionLiteral: ApplicationCommandOptionData['name'] = 'command';
export class ShowPermsCmdsImpl extends AbstractGuildCommand implements showPermsCmd {

    protected _id: Snowflake;
    protected _keyword = `perms`;
    protected _guide = `Shows permissions for specific command`;
    protected _usage = `perms <command>`;

    private constructor() { super() }

    static async init(): Promise<showPermsCmd> {
        const cmd = new ShowPermsCmdsImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['perms', 'perm', 'showperms', 'show_perms'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            options: [
                {
                    name: cmdOptionLiteral,
                    description: 'permissions for command',
                    type: 'STRING',
                    required: true,
                    choices: guildMap.get(guild_id).commandManager.commands
                        .map(cmd => ({ name: cmd.keyword, value: cmd.keyword }))
                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        await interaction.channel.send('**FIX:** *api perms lost on re-registration, asynced with db*');
        const commandLiteral = interaction.options.get(cmdOptionLiteral).value as string;
        const command_id: Snowflake = guildMap.get(interaction.guildId).commandManager.commands
            .find(cmd => cmd.matchAliases(commandLiteral))?.id
        if (!command_id)
            return interaction.reply({
                content: `command ${commandLiteral} not found`,
                ephemeral: true
            });
        const guild_prefix = guildMap.get(interaction.guildId).getSettings().prefix;
        await interaction.defer({ ephemeral: true });
        const commandPerms = await fetchCommandPerms(interaction.guildId, command_id);
        const reqRoles = await Promise.all(commandPerms.map(cp => interaction.guild.roles.fetch(cp.role_id)));
        let apiPerms: ApplicationCommandPermissions[];
        try {
            apiPerms = await interaction.guild.commands.permissions.fetch({ command: command_id })
        } catch (err) {
            if (err.code === Constants.APIErrors['UNKNOWN_APPLICATION_COMMAND_PERMISSIONS'])
                apiPerms = [];
            else
                console.log(err);
        }

        return interaction.editReply({
            embeds: [
                new MessageEmbed({
                    title: guild_prefix + commandLiteral,
                    description: `Enabled for :`,
                    fields: [
                        {
                            name: `Slash Command: **\`/${commandLiteral}\`**`,
                            /* if command is not locked, permissions will be empty*/
                            value: apiPerms.length > 0 ?
                                apiPerms.
                                    filter(perm => perm.permission)
                                    .map(perm => `<@&${perm.id}>`).toString()
                                : `<@&${interaction.guildId}>` //allowed for @everyone
                        },
                        {
                            name: `Manual Command: **\`${guild_prefix}${commandLiteral}\`**`,
                            value: reqRoles.toString()
                        }
                    ]
                })
            ]
        });
    }

    async execute(message: Message, { arg1 }: literalCommandType) {
        await message.channel.send('**FIX:** *api perms lost on re-registration, asynced with db*');
        const commandLiteral = arg1;
        if (!commandLiteral)
            return message.reply({ embeds: [new MessageEmbed({ description: this.guide })] })
        const command_id: Snowflake = guildMap.get(message.guild.id).commandManager.commands
            .find(cmd => cmd.matchAliases(commandLiteral))?.id
        if (!command_id)
            return message.reply(`command ${commandLiteral} not found`);
        const guild_prefix = guildMap.get(message.guild.id).getSettings().prefix;
        const commandPerms = await fetchCommandPerms(message.guild.id, command_id);
        const reqRoles = await Promise.all(commandPerms.map(cp => message.guild.roles.fetch(cp.role_id)));
        let apiPerms: ApplicationCommandPermissions[];
        try {
            apiPerms = await message.guild.commands.permissions.fetch({ command: command_id })
        } catch (err) {
            if (err.code === Constants.APIErrors['UNKNOWN_APPLICATION_COMMAND_PERMISSIONS'])
                apiPerms = []; //no specified roles
            else
                console.log(err);
        }
        return message.reply({
            embeds: [
                new MessageEmbed({
                    title: guild_prefix + commandLiteral,
                    description: `Enabled for :`,
                    fields: [
                        {
                            name: `Slash Command: **\`/${commandLiteral}\`**`,
                            /* if command is not locked, permissions will be empty*/
                            value: apiPerms.length > 0 ?
                                apiPerms
                                    .filter(perm => perm.permission) //filter out  allowed
                                    .map(perm => `<@&${perm.id}>`).toString()
                                : `<@&${message.guild.id}>` //allowed for everyone
                        },
                        {
                            name: `Manual Command: **\`${guild_prefix}${commandLiteral}\`**`,
                            value: reqRoles.toString()
                        }
                    ]
                })
            ]
        });
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}