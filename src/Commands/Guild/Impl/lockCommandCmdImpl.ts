
import { ApplicationCommandOptionData, ApplicationCommandPermissionData, ChatInputApplicationCommandData, Collection, CommandInteraction, GuildMember, Message, Permissions, Snowflake } from "discord.js";
import { commandLiteral } from "../../../Entities/Generic/command";
import { guildMap } from "../../../index";
import { fetchCommandID, overrideCommandPerms } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { lockCommandCmd } from "../Interf/lockCommandCmd";

const cmdOptionLiteral: ApplicationCommandOptionData['name'] = 'command_name';
//TODO: implement handeRequest
export class LockCommandCmdImpl extends AbstractGuildCommand implements lockCommandCmd {

    protected _id: Collection<Snowflake, Snowflake>;
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

    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
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

    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
        await interaction.deferReply({ ephemeral: true });
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
            .map(role => role?.id) //TODO: remove this
            .filter(id => id !== guild_id && typeof id !== "undefined"); //filter out @everyone & undeclared roles

        if (rolesKeyArr.length < 1)
            return interaction.editReply(`no point on locking for \`@everyone\`, mind as well unlock it 😉`)
        const commandLiteral = interaction.options.getString(cmdOptionLiteral, true);
        const command_id: Snowflake = (await fetchCommandID(commandLiteral, guild_id)).firstKey();

        /*
        * override perms for interaction
        */
        const allowedPerms: ApplicationCommandPermissionData[] = [...new Set(rolesKeyArr)].map(roleID => ({
            id: roleID,
            type: 'ROLE',
            permission: true
        }));
        let command = await interaction.guild.commands.fetch(command_id);
        //disable for @everyone
        command = await command.edit({ defaultPermission: false, description: command.description, name: command.name })
        await interaction.guild.commands.permissions.add({
            command: command_id,
            permissions: allowedPerms
        });

        /*
         * override perms for manual command in DB
         */
        await overrideCommandPerms(guild_id, command_id, [...new Set(rolesKeyArr)]);
        return interaction.editReply(`Command ${commandLiteral} locked for ${rolesKeyArr.map(id => `<@&${id}>`).toString()}`);
    }

    async execute(message: Message, receivedCommand: commandLiteral): Promise<unknown> {
        return message.reply(`Please use slash command \`/${this.usage}\``)
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }

}
