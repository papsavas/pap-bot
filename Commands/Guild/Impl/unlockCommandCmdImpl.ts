
import { ApplicationCommandData, ApplicationCommandOptionData, CommandInteraction, Message, Snowflake } from "discord.js";
import { guildMap } from "../../..";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { fetchCommandID, overrideCommandPerms } from "../../../Queries/Generic/Commands";
import { GunlockCommand as _guide } from '../../guides.json';
import { unlockCommand as _keyword } from '../../keywords.json';
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { unlockCommandCmd } from "../Interf/unlockCommandCmd";

const cmdOptionLiteral: ApplicationCommandOptionData['name'] = 'command_name';
export class UnlockCommandCmdImpl extends AbstractGuildCommand implements unlockCommandCmd {

    protected _id: Snowflake;
    private constructor() { super() }

    static async init(): Promise<unlockCommandCmd> {
        const cmd = new UnlockCommandCmdImpl();
        cmd._id = await fetchCommandID(_keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['unlockcmd', 'unlockcommand', 'unlock_command', 'unlock_cmd'],
            _keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide(),
            options: [
                {
                    name: cmdOptionLiteral,
                    description: 'command name to unlock',
                    type: 'STRING',
                    required: true,
                    choices: guildMap.get(guild_id).commandHandler.commands
                        .map(cmd => Object.assign({}, { name: cmd.getKeyword(), value: cmd.getKeyword() }))
                }
            ]
        }

    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const guild_id = interaction.guildID;
        const commandLiteral = interaction.options.get(cmdOptionLiteral).value as string;
        await interaction.defer({ ephemeral: true });
        const command_id: Snowflake = guildMap.get(guild_id).commandHandler.commands
            .find(cmd => cmd.matchAliases(commandLiteral))?.id
        await overrideCommandPerms(guild_id, command_id, [guild_id]);
        return interaction.editReply(`Command ${commandLiteral} unlocked`);
    }

    async execute(receivedMessage: Message, receivedCommand: literalCommandType): Promise<any> {
        const guild_id = receivedMessage.guild.id;
        const commands = guildMap.get(guild_id).commandHandler.commands;
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
        return receivedMessage.guild.commands.setPermissions(command_id, [{
            id: guild_id,
            type: 'ROLE',
            permission: true
        }]);
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
