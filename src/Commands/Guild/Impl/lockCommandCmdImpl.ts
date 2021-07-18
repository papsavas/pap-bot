
import { ApplicationCommandData, ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction, GuildMember, Message, Permissions, Snowflake } from "discord.js";
import { commandLiteral } from "../../../Entities/Generic/command";
import { guildMap } from "../../../index";
import { fetchCommandID, overrideCommandPerms } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { lockCommandCmd } from "../Interf/lockCommandCmd";

const cmdOptionLiteral: ApplicationCommandOptionData['name'] = 'command_name';

export class LockCommandCmdImpl extends AbstractGuildCommand implements lockCommandCmd {

    protected _id: Snowflake;
    protected _keyword = `lockcmd`;
    protected _guide = `Locks command for certain roles`;
    protected _usage = `lockcmd <cmd> <role1> [<role2>...]`;
    private constructor() { super() }

    static async init(): Promise<lockCommandCmd> {
        const cmd = new LockCommandCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['lockcmd', 'lockcommand', 'lock_command', 'lock_cmd'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
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
            ],
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        await interaction.defer({ ephemeral: true });
        const member = (interaction.member instanceof GuildMember) ?
            interaction.member :
            await interaction.guild.members.fetch(interaction.member.user.id);

        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
            return interaction.editReply({
                content: `\`MANAGE_GUILD permissions required\``
            });
        const guild_id = interaction.guildId;
        const filteredRoles = ["1", "2", "3", "4", "5"].map((n, i) => interaction.options.getRole(`role${n}`, i === 0))
        const rolesKeyArr = filteredRoles
            .map(role => role.id)
            .filter(id => id !== guild_id); //filter out @everyone

        if (rolesKeyArr.length < 1)
            return interaction.editReply(`no point on locking for \`@everyone\`, mind as well unlock it 😉`)
        const commandLiteral = interaction.options.getString(cmdOptionLiteral, true);
        const command_id: Snowflake = guildMap.get(guild_id).commandManager.commands
            .find(cmd => cmd.matchAliases(commandLiteral))?.id


        /*
         * override perms for manual command in DB
         */
        await overrideCommandPerms(guild_id, command_id, [...new Set(rolesKeyArr)]);
        const allowedPerms: ApplicationCommandPermissionData[] = [...new Set(rolesKeyArr)].map(roleID => ({
            id: roleID,
            type: 'ROLE',
            permission: true
        }));

        let command = await interaction.guild.commands.fetch(command_id);

        //disable for @everyone
        command = await command.edit(Object.assign(command, { defaultPermission: false }));

        /**
         * override perms for interaction
         */
        await interaction.guild.commands.permissions.add({
            command: command_id,
            permissions: allowedPerms
        });

        return interaction.editReply(`Command ${commandLiteral} locked for ${filteredRoles.toString()}`);
    }

    async execute(receivedMessage: Message, receivedCommand: commandLiteral): Promise<any> {
        if (!receivedMessage.member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
            return receivedMessage.reply(`\`MANAGE_GUILD permissions required\``);
        const guild_id = receivedMessage.guild.id;
        const rolesKeyArr: Snowflake[] = receivedMessage.mentions.roles.keyArray()
            .filter(id => id !== guild_id); //filter out @everyone

        if (rolesKeyArr.length < 1)
            return receivedMessage.reply(`you need to provide atleast 1 role.\n*\`@everyone\` doesn't count*`);
        const commandLiteral = receivedCommand.arg1; //cannot retrieve command from aliases, must be exact
        const command_id: Snowflake = guildMap.get(guild_id).commandManager.commands
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
        const allowedPerms = [...new Set(rolesKeyArr)].map(id => ({
            id: id,
            type: 'ROLE',
            permission: true
        })) as ApplicationCommandPermissionData[]
        let command = await receivedMessage.guild.commands.fetch(command_id);

        //disable for @everyone
        command = await command.edit(Object.assign(command, { defaultPermission: false }));

        await receivedMessage.guild.commands.permissions.add({
            command: command_id,
            permissions: allowedPerms
        });
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }

}
