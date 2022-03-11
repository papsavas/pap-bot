
import {
    ApplicationCommandData, ApplicationCommandOptionData, ApplicationCommandOptionType,
    ApplicationCommandPermissionData, ApplicationCommandPermissionType, ApplicationCommandType, ChatInputCommandInteraction, Collection, Message, PermissionFlagsBits, Snowflake
} from "discord.js";
import { guilds } from "../../..";
import { commandLiteral } from "../../../Entities/Generic/command";
import { dropCommandPerms, fetchCommandID, overrideCommandPerms } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { commandPermsCmd } from "../Interf/commandPermsCmd";

const [lockLiteral, unlockLiteral] = ["lock", "unlock"];
const cmdOptionLiteral: ApplicationCommandOptionData['name'] = 'command_name';

/*
TODO: support global commands
!Problem: input choices exceed limit of 25
?Solution: global / guild (second) subcommand
*/

//TODO: include listing perms
export class commandPermsCmdImpl extends AbstractGuildCommand implements commandPermsCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `command_perms`;
    readonly guide = `Lock/Unlock commands`;
    readonly usage = `${this.keyword} ${lockLiteral} <command> <role1> [role2...] | ${unlockLiteral} <command>`;
    private constructor() { super() }
    static async init(): Promise<commandPermsCmd> {
        const cmd = new commandPermsCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    readonly aliases = this.mergeAliases
        (
            [], this.keyword
        );
    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: lockLiteral,
                    description: `Lock a command`,
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: cmdOptionLiteral,
                            description: 'command name to override perms',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            choices: guilds.get(guild_id).commandManager.commands
                                .map(cmd => ({
                                    name: cmd.keyword,
                                    value: cmd.keyword
                                }))
                        },
                        {
                            name: 'role1',
                            description: 'allowed role',
                            type: ApplicationCommandOptionType.Role,
                            required: true,
                        },

                        {
                            name: 'role2',
                            description: 'allowed role',
                            type: ApplicationCommandOptionType.Role,
                            required: false
                        },

                        {
                            name: 'role3',
                            description: 'allowed role',
                            type: ApplicationCommandOptionType.Role,
                            required: false
                        },
                        {
                            name: 'role4',
                            description: 'allowed role',
                            type: ApplicationCommandOptionType.Role,
                            required: false
                        },
                        {
                            name: 'role5',
                            description: 'allowed role',
                            type: ApplicationCommandOptionType.Role,
                            required: false
                        },
                    ]
                },
                {
                    name: unlockLiteral,
                    description: `Unlock a command`,
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: cmdOptionLiteral,
                            description: 'command name to unlock',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            choices: guilds.get(guild_id).commandManager.commands
                                .map(cmd => ({ name: cmd.keyword, value: cmd.keyword }))
                        }
                    ]
                }
            ]
        }
    }
    async interactiveExecute(interaction: ChatInputCommandInteraction): Promise<unknown> {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.permissions.has(PermissionFlagsBits.ManageGuild))
            return interaction.reply({
                content: `\`MANAGE_GUILD\` permissions required`,
                ephemeral: true
            });

        const guild_id = interaction.guildId;
        const commandLiteral = interaction.options.getString(cmdOptionLiteral, true);
        await interaction.deferReply({ ephemeral: true });
        const command_id: Snowflake = (await fetchCommandID(commandLiteral, guild_id)).firstKey();
        if (!command_id)
            return interaction.editReply(`Command ${commandLiteral} not found`);
        const subcommand = interaction.options.getSubcommand(true);
        let allowedPerms: ApplicationCommandPermissionData[];
        const defaultPermission = subcommand === unlockLiteral;
        let command = await interaction.guild.commands.fetch(command_id);
        const editCommand = async (defaultPermission: boolean, allowedPerms: ApplicationCommandPermissionData[]) => {
            command = await command.edit({ defaultPermission, description: command.description, name: command.name })
            await interaction.guild.commands.permissions.set({
                command: command_id,
                permissions: allowedPerms
            });
        }
        if (subcommand === lockLiteral) {
            const filteredRoles = ["1", "2", "3", "4", "5"]
                .map((n, i) =>
                    interaction.options.getRole(`role${n}`, i === 0)?.id)
            const roleKeys = filteredRoles
                .filter(id => !!id && id !== guild_id); //filter out  undefined and @everyone
            if (roleKeys.length === 0)
                return interaction.editReply(`no point on locking for \`@everyone\`, mind as well unlock it 😉`)
            //override perms for interaction
            allowedPerms = [...new Set(roleKeys)].map(roleID => ({
                id: roleID,
                type: ApplicationCommandPermissionType.Role,
                permission: true
            }));
            await editCommand(defaultPermission, allowedPerms);
            await overrideCommandPerms(guild_id, command_id, [...new Set(roleKeys)]);
            return interaction.editReply(`Command ${commandLiteral} locked for ${roleKeys.map(id => `<@&${id}>`).toString()}`);
        }
        else if (subcommand === unlockLiteral) {
            await editCommand(defaultPermission, []);
            await dropCommandPerms(command_id, guild_id);
            return interaction.editReply(`Command ${commandLiteral} unlocked`);
        }
        else
            return interaction.editReply(`No implementation for ${subcommand} subcommand`)
    }

    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        return message.reply(`Please use Slash Command \`/${this.usage}\``);
    }




}