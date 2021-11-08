
import { ApplicationCommandOptionData, ChatInputApplicationCommandData, Collection, CommandInteraction, Message, Permissions, Snowflake } from "discord.js";
import { commandLiteral } from "../../../Entities/Generic/command";
import { guildMap } from "../../../index";
import { dropCommandPerms, fetchCommandID } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { unlockCommandCmd } from "../Interf/unlockCommandCmd";

const cmdOptionLiteral: ApplicationCommandOptionData['name'] = 'command_name';
export class UnlockCommandCmdImpl extends AbstractGuildCommand implements unlockCommandCmd {

    protected _id: Collection<Snowflake, Snowflake>;
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

    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
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

    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
        const member = await interaction.guild.members.fetch(interaction.member.user.id);
        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
            return interaction.reply({
                content: `\`MANAGE_GUILD\` permissions required`,
                ephemeral: true
            });

        const guild_id = interaction.guildId;
        const commandLiteral = interaction.options.getString(cmdOptionLiteral, true);
        await interaction.deferReply({ ephemeral: true });
        const command_id: Snowflake = (await fetchCommandID(commandLiteral, guild_id)).firstKey();

        /*
        * override perms for interaction
        */
        let command = await interaction.guild.commands.fetch(command_id);
        await interaction.guild.commands.permissions.set({
            command: command_id,
            permissions: []

        });

        //enable for @everyone
        command = await command.edit({ defaultPermission: true, description: command.description, name: command.name })

        /*
        * override perms for manual command in DB
        */
        await dropCommandPerms(command_id, guild_id);

        return interaction.editReply(`Command ${commandLiteral} unlocked`);
    }

    async execute(message: Message, receivedCommand: commandLiteral): Promise<unknown> {
        return message.reply(`Please use slash command \`/${this.usage}\``)
    }

    getAliases(): string[] {
        return this._aliases
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }

}
