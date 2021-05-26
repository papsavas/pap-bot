import {
    ApplicationCommand, ApplicationCommandData, ApplicationCommandManager,
    Collection,
    CommandInteraction,
    GuildApplicationCommandManager, Message, MessageEmbed, Snowflake
} from 'discord.js';
import { literalCommandType } from "../../Entities/Generic/commandType";
import { bugsChannel, guildMap } from "../../index";
import { GuildCommandHandler } from "./GuildCommandHandler";
import { GenericCommand } from "./GenericCommand";
import { overrideCommands } from '../../Queries/Generic/Commands';
require('dotenv').config();

export default class GuildCommandHandlerImpl implements GuildCommandHandler {

    readonly commands: GenericCommand[];
    private guildID: Snowflake;

    constructor(guild_id: Snowflake, commands: GenericCommand[]) {
        this.guildID = guild_id;
        this.commands = commands;
    }

    public async fetchGuildCommands(commandManager: GuildApplicationCommandManager)
        : Promise<Collection<Snowflake, ApplicationCommand>> {

        const applicationCommands: ApplicationCommandData[] = [];

        const helpCommand: ApplicationCommandData = {
            name: "help",
            description: "displays support for a certain command",
            options: [
                {
                    name: `command`,
                    description: `the specified command`,
                    type: 'STRING',
                    choices: this.commands.map(cmd => Object.assign({}, { name: cmd.getKeyword(), value: cmd.getGuide().substring(0, 99) })),
                    required: true
                }
            ]
        }

        const registeredCommands = await commandManager.fetch();
        if (false) {
            console.log('Equal :)')
            return registeredCommands;
        }
        else {

            console.log(`commands changed. Refreshing...`);
            await commandManager.set([]);
            const commandData: ApplicationCommandData[] = [];
            for (const cmd of this.commands) {
                try {
                    //const registeredCmd = await commandManager.create(cmd.getCommandData())
                    applicationCommands.push(cmd.getCommandData(this.guildID));
                    //add to db
                } catch (error) {
                    console.log(cmd.getCommandData(this.guildID).name, error);
                }
            }

            applicationCommands.push(helpCommand);
            //add to db
            const newCommands = await commandManager.set(applicationCommands);
            await overrideCommands(newCommands.array().map(cmd => Object.assign({}, {
                keyword: cmd.name,
                id: cmd.id,
                guide: cmd.description,
                aliases: this.commands
                    .find((cmds) => cmds.matchAliases(cmd.name)).getAliases()

            })))
            return Promise.resolve(newCommands);
        }
    }

    public onCommand(message: Message): Promise<any> {
        /* FLUSH 'commands' DB TABLE AND EXECUTE WHEN COMMANDS ARE COMPLETE
        ALSO CONNECT 'commands with command_perms' with foreign key on commands Completion
        this.commands.forEach(async (cmd) => {
    
                try{
                    await addRow('commands', {
                        "keyword" : cmd.getKeyword(),
                        "aliases" : cmd.getAliases(),
                        "guide" : cmd.getGuide()
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
            if (['help', 'h'].includes(candidateCommand.primaryCommand))
                return this.helpCmd(message, commandImpl);

            return commandImpl.execute(commandMessage, candidateCommand)
                .then(execution => commandMessage
                    ?.react('✅')
                    .then(msgReaction => {
                        //msgReaction.remove().catch()
                        const userReactions = msgReaction.message.reactions.cache
                            .filter(reaction => reaction.users.cache.has(process.env.BOT_ID));
                        userReactions.forEach(reaction => reaction.users.remove(process.env.BOT_ID).catch());
                    })
                    .catch(err => {
                    }))
                .catch(err => this.invalidCommand(err, commandMessage, commandImpl, candidateCommand.primaryCommand));
        } else
            return message.react('❔').catch();
    }

    onSlashCommand(interaction: CommandInteraction): Promise<any> {
        if (interaction.commandName == 'help')
            return interaction.reply({
                embeds: [
                    new MessageEmbed({
                        description: interaction.options[0].value as string
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
        bugsChannelEmbed.setDescription(err);
        bugsChannelEmbed.addField(`caused by`, interaction.id);
        bugsChannel.send(bugsChannelEmbed).catch(internalErr => console.log("internal error\n", internalErr));
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

        const interactionPromise: Promise<any> = interaction.replied ?
            interaction.editReply(interactionEmb) : interaction.reply(interactionEmb);
        interactionPromise
            .then(() => interaction.client.setTimeout(() => interaction.deleteReply().catch(), 15000))
            .catch();
        console.log(`Error on Command ${primaryCommandLiteral}\n${err.stack}`)
    }


    private invalidCommand(err: Error, commandMessage: Message, commandImpl: GenericCommand, primaryCommandLiteral: string) {
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
        bugsChannelEmbed.setDescription(err);
        bugsChannelEmbed.addField(`caused by`, commandMessage.url);
        bugsChannel.send(bugsChannelEmbed).catch(internalErr => console.log("internal error\n", internalErr));
        //send feedback to member
        commandMessage.reply(new MessageEmbed(
            {
                author: {
                    name: `Error on Command`,
                    icon_url: `https://www.iconfinder.com/data/icons/freecns-cumulus/32/519791-101_Warning-512.png`
                },
                title: guildMap.get(commandMessage.guild.id).getSettings().prefix + commandImpl.getKeyword(),
                description: commandImpl.getGuide(),
                fields: [{ name: `Specified error  💥`, value: `• ${err}` }],
                footer: { text: commandImpl.getAliases().toString() },
                color: "RED"
            })
        ).then(msg => msg.client.setTimeout(() => msg.delete(), 15000));
        console.log(`Error on Command ${primaryCommandLiteral}\n${err.stack}`)
    }

    private helpCmd(message: Message, command: GenericCommand): Promise<any> {
        return message.reply(new MessageEmbed({
            title: command.getKeyword(),
            description: command.getGuide(),
            footer: { text: command.getAliases().toString() }
        }))
    }
}