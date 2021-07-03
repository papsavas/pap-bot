import {
    ApplicationCommand,
    Collection, ApplicationCommandData,
    CommandInteraction,
    GuildApplicationCommandManager, Message, MessageEmbed, Snowflake
} from 'discord.js';
import { CommandManagerImpl } from './CommandManagerImpl';
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { bugsChannel, guildMap } from "../../../index";
import { GuildCommandManager } from "../Interf/GuildCommandManager";
import { GenericCommand } from "../../GenericCommand";
import { overrideCommands } from '../../../Queries/Generic/Commands';
import GenericGuildCommand from '../../Guild/GenericGuildCommand';
require('dotenv').config();

export class GuildCommandManagerImpl extends CommandManagerImpl implements GuildCommandManager {

    private readonly guildID: Snowflake;
    private readonly helpCommandData: ApplicationCommandData;
    readonly commands: GenericGuildCommand[];

    constructor(guild_id: Snowflake, guildCommands: GenericGuildCommand[]) {
        super();
        this.guildID = guild_id;
        this.commands = guildCommands;
        this.helpCommandData = {
            name: "help",
            description: "displays support for a certain command",
            options: [
                {
                    name: `command`,
                    description: `the specified command`,
                    type: 'STRING',
                    choices: this.commands.map(cmd => ({
                        name: cmd.keyword,
                        value: cmd.guide.substring(0, 99)
                    })),
                    required: true
                }
            ]
        }
    }

    //!deprecated
    async fetchGuildCommands(commandManager: GuildApplicationCommandManager)
        : Promise<Collection<Snowflake, ApplicationCommand>> {

        const applicationCommands: ApplicationCommandData[] = [];
        const registeredCommands = await commandManager.fetch();

        /**
         * TODO: Implement Comparison for current & registered commands
         */
        if (false/*no update required*/) {
            console.log('Equal :)')
            return registeredCommands;
        }
        else /*commands changed, refresh*/ {
            console.log(`commands changed. Refreshing...`);
            await commandManager.set([]); //remove previous 
            for (const cmd of this.commands) {
                try {
                    applicationCommands.push(cmd.getCommandData(this.guildID));
                } catch (error) {
                    console.log(cmd.getCommandData(this.guildID).name, error);
                }
            }
            applicationCommands.push(this.helpCommandData);
            const newCommands = await commandManager.set(applicationCommands);
            //add to db
            await overrideCommands(newCommands.array().map(cmd => (
                {
                    keyword: cmd.name,
                    id: cmd.id,
                    guide: cmd.description,
                    aliases: this.commands
                        .find((cmds) => cmds.matchAliases(cmd.name))?.getAliases() ?? []

                }
            )));
            return newCommands;
        }
    }

    onManualCommand(message: Message): Promise<unknown> {
        /*
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

}