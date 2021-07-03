import {
    ApplicationCommand,
    Collection, ApplicationCommandData,
    CommandInteraction,
    GuildApplicationCommandManager, Message, MessageEmbed, Snowflake
} from 'discord.js';
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { bugsChannel, guildMap } from "../../../index";
import { GuildCommandManager } from "../Interf/GuildCommandManager";
import { GenericCommand } from "../../GenericCommand";
import { overrideCommands } from '../../../Queries/Generic/Commands';
import GenericGuildCommand from '../../Guild/GenericGuildCommand';
require('dotenv').config();

export default class GuildCommandManagerImpl implements GuildCommandManager {

    private readonly guildID: Snowflake;
    private readonly helpCommandData: ApplicationCommandData;
    readonly commands: GenericGuildCommand[];

    constructor(guild_id: Snowflake, guildCommands: GenericGuildCommand[]) {
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
        const candidateCommand = this.returnCommand(message);
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

    private returnCommand(receivedMessage: Message): literalCommandType {
        const receivedMessageContent = receivedMessage.content;
        const fullCommand: string = receivedMessageContent.substr(guildMap.get(receivedMessage.guild.id).getSettings().prefix.length); // Remove the prefix;
        const splitCommand: string[] = fullCommand.split(/(\s+)/).filter(e => e.trim().length > 0) //split command from space(s);
        return {
            //prefix,
            fullCommand,
            splitCommand,
            primaryCommand: splitCommand[0], // The first word directly after the exclamation is the command
            arg1: splitCommand[1],
            arg2: splitCommand[2],
            arg3: splitCommand[3],
            commandless1: splitCommand.slice(1).join(' '),
            commandless2: splitCommand.slice(2).join(' '),
            commandless3: splitCommand.slice(3).join(' ')
        }
    }

    private invalidSlashCommand(err: Error, interaction: CommandInteraction, primaryCommandLiteral: string) {
        const bugsChannelEmbed = new MessageEmbed({
            author: {
                name: interaction.guild.name,
                icon_url: "https://icon-library.com/images/error-icon-transparent/error-icon-transparent-13.jpg"
            },
            thumbnail: {
                proxy_url: interaction.guild.iconURL({ format: "png", size: 512 })
            },
            title: primaryCommandLiteral,
            color: "DARK_RED",
            timestamp: new Date()
        });
        bugsChannelEmbed.setDescription(err.message);
        bugsChannelEmbed.addField(`caused by`, interaction.id);
        bugsChannel.send({ embeds: [bugsChannelEmbed] }).catch(internalErr => console.log("internal error\n", internalErr));
        //send feedback to member

        const interactionEmb = new MessageEmbed(
            {
                author: {
                    name: `Error on Command`,
                    icon_url: `https://www.iconfinder.com/data/icons/freecns-cumulus/32/519791-101_Warning-512.png`
                },
                title: guildMap.get(interaction.guild.id).getSettings().prefix + interaction.commandName,
                fields: [{ name: `Specified error  💥`, value: `• ${err}` }],
                color: 'RED'
            })

        const interactionPromise: Promise<unknown> = interaction.replied ?
            interaction.editReply({ embeds: [interactionEmb] }) : interaction.reply({ embeds: [interactionEmb] });
        interactionPromise
            .then(() => interaction.client.setTimeout(() => interaction.deleteReply().catch(), 15000))
            .catch();
        console.log(`Error on Command ${primaryCommandLiteral}\n${err.stack}`)
    }


    private invalidCommand(err: Error, commandMessage: Message, commandImpl: GenericCommand, primaryCommandLiteral: string) {
        const prefix = guildMap.get(commandMessage.guild.id).getSettings().prefix;
        const bugsChannelEmbed = new MessageEmbed({
            author: {
                name: commandMessage.guild.name,
                icon_url: "https://icon-library.com/images/error-icon-transparent/error-icon-transparent-13.jpg"
            },
            thumbnail: {
                proxy_url: commandMessage.guild.iconURL({ format: "png", size: 512 })
            },
            title: primaryCommandLiteral,
            color: "DARK_RED",
            timestamp: new Date()
        });
        bugsChannelEmbed.setDescription(err.message);
        bugsChannelEmbed.addField(`caused by`, commandMessage.url);
        bugsChannel.send({ embeds: [bugsChannelEmbed] }).catch(internalErr => console.log("internal error\n", internalErr));
        //send feedback to member
        commandMessage.reply({
            embeds: [
                new MessageEmbed(
                    {
                        author: {
                            name: `Error on Command`,
                            icon_url: `https://www.iconfinder.com/data/icons/freecns-cumulus/32/519791-101_Warning-512.png`
                        },
                        title: prefix + commandImpl.keyword,
                        description: prefix + commandImpl.usage,
                        fields: [{ name: `Specified error  💥`, value: `• ${err}` }],
                        footer: { text: commandImpl.getAliases().toString() },
                        color: "RED"
                    })
            ]
        }
        ).then(msg => msg.client.setTimeout(() => msg.delete(), 15000));
        console.log(`Error on Command ${primaryCommandLiteral}\n${err.stack}`)
    }

    private helpCmd(message: Message, providedCommand: GenericCommand): Promise<Message> {
        if (typeof providedCommand !== 'undefined')
            return message.reply({
                embeds:
                    [
                        new MessageEmbed({
                            title: providedCommand.keyword,
                            description: providedCommand.guide,
                            footer: { text: providedCommand.getAliases().toString() }
                        })
                    ]
            })
        else
            return message.reply(`command not found`);
    }
}