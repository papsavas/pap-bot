import {
    ApplicationCommand, ApplicationCommandData, ApplicationCommandManager, ApplicationCommandPermissionData, Collection, CommandInteraction,
    GuildApplicationCommandManager, Message, MessageEmbed, Snowflake
} from 'discord.js';
import { CommandType } from '../../../Entities/Generic/commandType';
import { guildMap } from "../../../index";
import { fetchCommandPerms, overrideCommands } from '../../../Queries/Generic/Commands';
import { GenericCommand } from "../../GenericCommand";
import GenericGuildCommand from '../../Guild/GenericGuildCommand';
import { GuildCommandManager } from "../Interf/GuildCommandManager";
import { CommandManagerImpl } from './CommandManagerImpl';
require('dotenv').config();

export class GuildCommandManagerImpl extends CommandManagerImpl implements GuildCommandManager {
    private readonly guildID: Snowflake;
    readonly commands: GenericGuildCommand[];

    constructor(guild_id: Snowflake, guildCommands: GenericGuildCommand[]) {
        super(guildCommands);
        this.guildID = guild_id;
        this.commands = guildCommands;
    }

    onManualCommand(message: Message): Promise<unknown> {
        /*
        TODO: implement permission guard
        TODO: FLUSH 'commands' DB TABLE AND EXECUTE WHEN COMMANDS ARE COMPLETE
        TODO: CONNECT 'commands with command_perms' with foreign key on commands Completion
        this.commands.forEach(async (cmd) => {
    
                try{
                    await addRow('commands', {
                        "keyword" : cmd.keyword,
                        "aliases" : cmd.getAliases(),
                        "guide" : cmd.guide
                    });
                }
                catch (err){
                    console.log(err)
                }
        })
    */

        const guildHandler = guildMap.get(message.guild.id);
        const prefix = guildHandler.getSettings().prefix;
        const commandMessage = message;
        const candidateCommand = this.sliceCommandLiterals(message);
        const commandImpl = this.commands
            .find((cmds: GenericCommand) => cmds.matchAliases(candidateCommand?.primaryCommand));

        if (typeof commandImpl !== "undefined") {
            return commandImpl.execute(commandMessage, candidateCommand)
                .then(execution => commandMessage
                    ?.react('✅')
                    .then(msgReaction => {
                        //msgReaction.remove().catch()
                        const userReactions = msgReaction.message.reactions.cache
                            .filter(reaction => reaction.users.cache.has(process.env.BOT_ID as Snowflake));
                        userReactions.forEach(reaction => reaction.users.remove(process.env.BOT_ID as Snowflake).catch());
                    })
                    .catch(err => {
                    }))
                .catch(err => this.invalidCommand(err, commandMessage, commandImpl, candidateCommand.primaryCommand));
        }
        else if (['help', 'h'].includes(candidateCommand.primaryCommand))
            return this.helpCmd(
                message,
                this.commands
                    .find((cmds: GenericCommand) => cmds.matchAliases(candidateCommand?.arg1)));
        else
            return message.react('❔').catch();
    }

    onSlashCommand(interaction: CommandInteraction): Promise<unknown> {
        if (interaction.commandName == 'help')
            return interaction.reply({
                embeds: [
                    new MessageEmbed({
                        description: interaction.options.get('command').value as string
                    })
                ]
                , ephemeral: true
            }).catch(err => this.invalidSlashCommand(err, interaction, 'help'))


        const candidateCommand = this.commands.find((cmds: GenericCommand) => cmds.matchAliases(interaction.commandName))
        if (typeof candidateCommand !== "undefined")
            return candidateCommand.interactiveExecute(interaction)
                .catch(err => this.invalidSlashCommand(err, interaction, interaction.commandName));
        else
            return interaction.reply(`Command not found`);
    }

    fetchCommandData(commands: GenericGuildCommand[]): ApplicationCommandData[] {
        const applicationCommands: ApplicationCommandData[] = [];
        for (const cmd of commands) {
            applicationCommands.push(cmd.getCommandData(this.guildID));
        }
        return applicationCommands;
    }

    saveCommandData(newCommands: Collection<Snowflake, ApplicationCommand>): Promise<CommandType[]> {
        return overrideCommands(newCommands.array().map(cmd => (
            {
                keyword: cmd.name,
                id: cmd.id,
                guide: cmd.description,
                global: false,
                aliases: this.commands
                    .find((cmds) => cmds.matchAliases(cmd.name))?.getAliases() ?? []

            })
        ));
    }

    async updateCommands(commandManager: GuildApplicationCommandManager | ApplicationCommandManager) {
        const newCommands = await super.updateCommands(commandManager);
        console.table(await this.syncPermissions(commandManager, newCommands));
        return newCommands;
    }

    private syncPermissions(
        commandManager: ApplicationCommandManager | GuildApplicationCommandManager,
        commands: Collection<Snowflake, ApplicationCommand<{}>>
    ) {

        return Promise.all(commands.array().map(async cmd => {
            const dbPerms: ApplicationCommandPermissionData[] = (await fetchCommandPerms(cmd.guildId, cmd.id)).map(res => ({
                id: res.role_id,
                type: 'ROLE',
                permission: true
            }))
            commandManager.permissions.set({
                command: cmd.id,
                guild: this.guildID,
                permissions: dbPerms
            })
        }));
    }
}