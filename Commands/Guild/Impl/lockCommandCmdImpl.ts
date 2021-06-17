
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { ApplicationCommandData, ApplicationCommandOptionChoice, ApplicationCommandOptionData, ApplicationCommandPermissions, CommandInteraction, GuildMember, Message, Permissions, Snowflake } from "discord.js";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import { lockCommandCmd } from "../Interf/lockCommandCmd";
import { fetchCommandID, overrideCommandPerms } from "../../../Queries/Generic/Commands";
import { guildMap } from "../../..";

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
                    choices: guildMap.get(guild_id).commandHandler.commands
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
        const member = (interaction.member instanceof GuildMember) ?
            interaction.member :
            await interaction.guild.members.fetch(interaction.member.user.id);

        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
            return interaction.reply({
                content: `\`MANAGE_GUILD permissions required\``,
                ephemeral: true
            });
        const guild_id = interaction.guildID;
        const filteredRoles = interaction.options.filter(option => option.type == "ROLE");
        const rolesKeyArr = filteredRoles.map(filteredOptions => filteredOptions.role.id);
        const commandLiteral = interaction.options.get(cmdOptionLiteral).value as string;
        const command_id: Snowflake = guildMap.get(guild_id).commandHandler.commands
            .find(cmd => cmd.matchAliases(commandLiteral))?.id
        await interaction.defer({ ephemeral: true });
        /*
         * override perms for manual command in DB
         */
        await overrideCommandPerms(guild_id, command_id, [...new Set(rolesKeyArr)]);
        const allowedPerms = [...new Set(rolesKeyArr)].map(id => ({
            id: id,
            type: 'ROLE',
            permission: true
        })) as ApplicationCommandPermissions[];
        let command = await interaction.guild.commands.fetch(command_id);
        //disable for @everyone
        command = await command.edit(Object.assign(command, { defaultPermission: false }));
        /**
         * override perms for interaction
         */
        await command.setPermissions(allowedPerms);
        return interaction.editReply(`Command ${commandLiteral} locked for ${filteredRoles.map(ro => ro.role).toString()}`);
    }

    async execute(receivedMessage: Message, receivedCommand: literalCommandType): Promise<any> {
        if (!receivedMessage.member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
            return receivedMessage.reply(`\`MANAGE_GUILD permissions required\``);
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
        const allowedPerms = [...new Set(rolesKeyArr)].map(id => ({
            id: id,
            type: 'ROLE',
            permission: true
        })) as ApplicationCommandPermissions[]
        let command = await receivedMessage.guild.commands.fetch(command_id);
        //disable for @everyone
        command = await command.edit(Object.assign(command, { defaultPermission: false }));
        await command.setPermissions(allowedPerms);
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }

}
