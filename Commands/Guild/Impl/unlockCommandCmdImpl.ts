
import { AbstractCommand } from "../AbstractCommand";
import { unlockCommand as _keyword } from '../../keywords.json';
import { GunlockCommand as _guide } from '../../guides.json';
import { ApplicationCommandData, ApplicationCommandOptionChoice, CommandInteraction, Message, Snowflake } from "discord.js";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import { fetchCommandID, overrideCommandPerms } from "../../../Queries/Generic/Commands";
import { unlockCommandCmd } from "../Interf/unlockCommandCmd";
import { guildMap } from "../../..";
import { loadGuildLogs } from "../../../Queries/Generic/guildLogs";


export class UnlockCommandCmdImpl extends AbstractCommand implements unlockCommandCmd {

    readonly id: Snowflake = fetchCommandID(_keyword);

    private readonly _aliases = this.addKeywordToAliases
        (
            ['unlockcmd', 'unlockcommand', 'unlock_command', 'unlock_cmd'],
            _keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        let choices: ApplicationCommandOptionChoice[];
        (async function () {
            const cmds = await guildMap.get(guild_id).fetchCommands();
            choices = cmds.map(cmd => Object.assign({}, { name: cmd.name, value: cmd.name }))
        }())
        return {
            name: `unlockCommand`,
            description: this.getGuide(),
            options: [
                {
                    name: 'command_name',
                    description: 'command name to unlock',
                    type: 'STRING',
                    required: true,
                    choices: choices
                }
            ]
        }

    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const guild_id = interaction.guildID;
        const command_id = interaction.options[0].value as string; //cannot retrieve command from aliases, must be exact
        await interaction.defer(true);
        await overrideCommandPerms(guild_id, command_id, [guild_id]);
        return interaction.editReply(`Command ${command_id} unlocked`);
    }

    async execute(receivedMessage: Message, receivedCommand: literalCommandType): Promise<any> {
        const guild_id = receivedMessage.guild.id;
        const commands = guildMap.get(guild_id).commandHandler.commands;
        const command_id = receivedCommand.arg1; //cannot retrieve command from aliases, must be exact
        const candidateCommand = commands.find((cmds) => cmds.matchAliases(command_id))
        //override perms for manual command in DB
        await overrideCommandPerms(guild_id, command_id, [guild_id]);
        if (typeof candidateCommand !== "undefined")
            //override perms for interaction
            return receivedMessage.guild.commands.setPermissions(command_id, [{
                id: guild_id,
                type: 'ROLE',
                permission: true
            }])
        else
            return receivedMessage.reply(`Command not found`);

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
