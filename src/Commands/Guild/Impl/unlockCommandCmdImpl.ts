
import { ApplicationCommandData, ApplicationCommandOptionData, CommandInteraction, GuildMember, Message, Permissions, Snowflake } from "discord.js";
import { commandLiteral } from "../../../Entities/Generic/command";
import { guildMap } from "../../../index";
import { fetchCommandID, overrideCommandPerms } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { unlockCommandCmd } from "../Interf/unlockCommandCmd";

const cmdOptionLiteral: ApplicationCommandOptionData['name'] = 'command_name';
export class UnlockCommandCmdImpl extends AbstractGuildCommand implements unlockCommandCmd {

    protected _id: Snowflake;
    protected _keyword = `unlockcmd`;
    protected _guide = `Unlocks command for everyone`;
    protected _usage = `unlock <command>`;

    private constructor() { super() }

    static async init(): Promise<unlockCommandCmd> {
        const cmd = new UnlockCommandCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['unlockcmd', 'unlockcommand', 'unlock_command', 'unlock_cmd'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
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

        const guild_id = interaction.guildId;
        const commandLiteral = interaction.options.get(cmdOptionLiteral).value as string;
        await interaction.defer({ ephemeral: true });
        const command_id: Snowflake = guildMap.get(guild_id).commandManager.commands
            .find(cmd => cmd.matchAliases(commandLiteral))?.id
        /**
        * override perms for manual command in DB
        */
        await overrideCommandPerms(guild_id, command_id, [guild_id]);

        /**
         * override perms for interaction
         */
        let command = await interaction.guild.commands.fetch(command_id);
        //enable for @everyone
        command = await command.edit(Object.assign(command, { defaultPermission: true }));
        await interaction.guild.commands.permissions.set({
            command: command_id,
            permissions: []

        });

        return interaction.editReply(`Command ${commandLiteral} unlocked`);
    }

    async execute(receivedMessage: Message, receivedCommand: commandLiteral): Promise<any> {
        if (!receivedMessage.member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
            return receivedMessage.reply(`\`MANAGE_GUILD permissions required\``);
        const guild_id = receivedMessage.guild.id;
        const commands = guildMap.get(guild_id).commandManager.commands;
        const commandLiteral = receivedCommand.arg1 as Snowflake;
        const command_id = commands.find((cmds) => cmds.matchAliases(commandLiteral))?.id
        if (!command_id)
            return receivedMessage.reply(`command ${commandLiteral} not found`);
        /*
         * override perms for manual command in DB
         */
        await overrideCommandPerms(guild_id, command_id, [guild_id]);

        /**
         * override perms for interaction
         */
        let command = await receivedMessage.guild.commands.fetch(command_id);
        //enable for @everyone
        command = await command.edit(Object.assign(command, { defaultPermission: true }));

        await receivedMessage.guild.commands.permissions.set({
            command: command_id,
            permissions: []
        });

        return Promise.resolve()
    }

    getAliases(): string[] {
        return this._aliases
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }

}
