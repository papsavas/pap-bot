
import { ApplicationCommandData, ApplicationCommandOptionData, ApplicationCommandPermissionData, Collection, CommandInteraction, Message, Permissions, Snowflake } from "discord.js";
import { guildMap } from "../../..";
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
export class commandPermsCmdImpl extends AbstractGuildCommand implements commandPermsCmd {

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `command_perms`;
    protected _guide = `Lock/Unlock commands`;
    protected _usage = `${this.keyword} ${lockLiteral} <command> <role1> [role2...] | ${unlockLiteral} <command>`;
    private constructor() { super() }
    static async init(): Promise<commandPermsCmd> {
        const cmd = new commandPermsCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    private readonly _aliases = this.addKeywordToAliases
        (
            [], this.keyword
        );
    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: lockLiteral,
                    description: `Lock a command`,
                    type: 'SUB_COMMAND',
                    options: [
                        {
                            name: cmdOptionLiteral,
                            description: 'command name to override perms',
                            type: 'STRING',
                            required: true,
                            choices: guildMap.get(guild_id).commandManager.commands
                                .map(cmd => ({
                                    name: cmd.keyword,
                                    value: cmd.keyword
                                }))
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
                    ]
                },
                {
                    name: unlockLiteral,
                    description: `Unlock a command`,
                    type: 'SUB_COMMAND',
                    options: [
                        {
                            name: cmdOptionLiteral,
                            description: 'command name to unlock',
                            type: 'STRING',
                            required: true,
                            choices: guildMap.get(guild_id).commandManager.commands
                                .map(cmd => ({ name: cmd.keyword, value: cmd.keyword }))
                        }
                    ]
                }
            ]
        }
    }
    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
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
                type: 'ROLE',
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

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}