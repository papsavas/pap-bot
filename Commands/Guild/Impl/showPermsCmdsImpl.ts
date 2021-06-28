import { ApplicationCommandData, ApplicationCommandOptionData, ApplicationCommandPermissions, CommandInteraction, Message, MessageEmbed, Snowflake } from 'discord.js';
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
                    choices: guildMap.get(guild_id).commandHandler.commands
                        .map(cmd => ({ name: cmd.keyword, value: cmd.keyword }))
                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        await interaction.channel.send('**FIX:** *api perms lost on re-registration, asynced with db*');
        const commandLiteral = interaction.options.get(cmdOptionLiteral).value as string;
        const command_id: Snowflake = guildMap.get(interaction.guildID).commandHandler.commands
            .find(cmd => cmd.matchAliases(commandLiteral))?.id
        if (!command_id)
            return interaction.reply({
                content: `command ${commandLiteral} not found`,
                ephemeral: true
            });
        const guild_prefix = guildMap.get(interaction.guildID).getSettings().prefix;
        await interaction.defer({ ephemeral: true });
        const commandPerms = await fetchCommandPerms(interaction.guildID, command_id);
        const reqRoles = await Promise.all(commandPerms.map(cp => interaction.guild.roles.fetch(cp.role_id)));
        const apiPerms = await interaction.guild.commands.fetchPermissions();
        return interaction.editReply({
            embeds: [
                new MessageEmbed({
                    title: guild_prefix + commandLiteral,
                    description: `Enabled for :`,
                    fields: [
                        {
                            name: `Slash Command: **\`/${commandLiteral}\`**`,
                            /* if command is not locked, permissions will be empty*/
                            value: apiPerms.get(command_id)?.
                                filter(perm => perm.permission)
                                .map(perm => `<@&${perm.id}>`).toString() ?? `<@&${interaction.guildID}>`
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
        const command_id: Snowflake = guildMap.get(message.guild.id).commandHandler.commands
            .find(cmd => cmd.matchAliases(commandLiteral))?.id
        if (!command_id)
            return message.reply(`command ${commandLiteral} not found`);
        const guild_prefix = guildMap.get(message.guild.id).getSettings().prefix;
        const commandPerms = await fetchCommandPerms(message.guild.id, command_id);
        const reqRoles = await Promise.all(commandPerms.map(cp => message.guild.roles.fetch(cp.role_id)));
        const apiPerms = await message.guild.commands.fetchPermissions();
        return message.reply({
            embeds: [
                new MessageEmbed({
                    title: guild_prefix + commandLiteral,
                    description: `Enabled for :`,
                    fields: [
                        {
                            name: `Slash Command: **\`/${commandLiteral}\`**`,
                            /* if command is not locked, permissions will be empty*/
                            value: apiPerms.get(command_id)?.
                                filter(perm => perm.permission)
                                .map(perm => `<@&${perm.id}>`).toString() ?? `<@&${message.guild.id}>`
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