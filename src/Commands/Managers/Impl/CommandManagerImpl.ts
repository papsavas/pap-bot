import {
    ApplicationCommand, ApplicationCommandData, ApplicationCommandManager,
    Collection, CommandInteraction, ContextMenuInteraction, GuildApplicationCommandManager, Message, MessageEmbed, Snowflake
} from "discord.js";
import { prefix as defaultPrefix } from "../../../../botconfig.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { bugsChannel, guildMap } from "../../../index";
import { GenericCommand } from "../../GenericCommand";
import { CommandManager } from "../Interf/CommandManager";

export abstract class CommandManagerImpl implements CommandManager {
    readonly commands: GenericCommand[];
    protected readonly helpCommandData: ApplicationCommandData;
    abstract fetchCommandData(commands: GenericCommand[]): ApplicationCommandData[];
    abstract saveCommandData(commands: Collection<Snowflake, ApplicationCommand>): Promise<unknown>;

    constructor(commands: GenericCommand[]) {
        this.helpCommandData = {
            name: "help",
            description: `[${commands[0].type.toString()}] displays support for a certain command`,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: `command`,
                    description: `the specified command`,
                    type: 'STRING',
                    choices: commands.map(cmd => ({
                        name: cmd.keyword,
                        value: cmd.guide?.substring(0, 99) ?? 'context app'
                    })),
                    required: true
                }
            ]
        }
    }


    onSlashCommand(interaction: CommandInteraction | ContextMenuInteraction): Promise<unknown> {
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
    };

    //TODO: implement permission guard
    async onManualCommand(message: Message): Promise<unknown> {
        const guildHandler = guildMap.get(message.guild?.id);
        const prefix = guildHandler?.getSettings().prefix ?? defaultPrefix;
        const commandMessage = message;
        const candidateCommand = this.sliceCommandLiterals(message, prefix);
        const commandImpl = this.commands
            .find((cmds: GenericCommand) => cmds.matchAliases(candidateCommand?.primaryCommand));

        if (typeof commandImpl !== "undefined") {
            let emote: string;
            try {
                await commandImpl.execute(commandMessage, candidateCommand);
                emote = '✅';
            } catch (error) {
                this.invalidCommand(error, commandMessage, commandImpl, candidateCommand.primaryCommand, prefix);
                emote = '❌';
            }
            finally {
                const reaction = await commandMessage.react(emote);
                await reaction.users.remove(reaction.client.user.id);
            }
        }

        else if (['help', 'h'].includes(candidateCommand.primaryCommand))
            return this.helpCmd(
                message,
                this.commands
                    .find((cmds: GenericCommand) => cmds.matchAliases(candidateCommand?.arg1)));
        else
            return message.react('❔').catch();
    };

    async updateCommands(commandManager: ApplicationCommandManager | GuildApplicationCommandManager)
        : Promise<Collection<Snowflake, ApplicationCommand<{}>>> {
        const applicationCommands: ApplicationCommandData[] = this.fetchCommandData(this.commands);
        console.log(`updating ${this.commands[0].type} commands`);
        applicationCommands.push(this.helpCommandData);
        const newCommands = await commandManager.set(applicationCommands);
        await this.saveCommandData(newCommands); //DB
        console.log(`---${this.commands[0].type} commands updated---`);
        return newCommands;
    }

    clearCommands(commandManager: ApplicationCommandManager | GuildApplicationCommandManager) {
        return commandManager.set([]);
    }

    protected sliceCommandLiterals(receivedMessage: Message, prefix: string): commandLiteral {
        const receivedMessageContent = receivedMessage.content;
        const fullCommand: string = receivedMessageContent.substr(prefix.length); // Remove the prefix;
        const splitCommand: string[] = fullCommand
            .split(/(\s+)/)
            .filter(e => e.trim().length > 0) //split command from space(s);
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

    protected invalidSlashCommand(err: Error, interaction: CommandInteraction, primaryCommandLiteral: string) {
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
        bugsChannel.send({ embeds: [bugsChannelEmbed] })
            .catch(internalErr => console.log("internal error\n", internalErr));

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

        //send feedback to member
        const interactionPromise: Promise<unknown> = interaction.replied ?
            interaction.editReply({ embeds: [interactionEmb] }) : interaction.reply({ embeds: [interactionEmb] });
        interactionPromise
            .then(() => setTimeout(() => interaction.deleteReply().catch(), 20000))
            .catch();
        console.log(`Error on Command ${primaryCommandLiteral}\n${err.stack}`)
    }


    protected async invalidCommand(err: Error, commandMessage: Message, commandImpl: GenericCommand, primaryCommandLiteral: string, prefix: string) {
        console.log(`Error on Command ${primaryCommandLiteral}\n${err.message}`);
        const bugsChannelEmbed = new MessageEmbed({
            author: {
                name: commandMessage.guild?.name ?? commandMessage.author.username,
                icon_url: "https://icon-library.com/images/error-icon-transparent/error-icon-transparent-13.jpg"
            },
            thumbnail: {
                proxy_url: commandMessage.guild?.iconURL({ format: "png", size: 512 }) ?? commandMessage.author.avatarURL({ format: "png", size: 512 }),
            },
            title: primaryCommandLiteral,
            color: "DARK_RED",
            timestamp: new Date()
        });
        bugsChannelEmbed.setDescription(err.message);
        bugsChannelEmbed.addField(`caused by`, commandMessage.url);
        await bugsChannel.send({ embeds: [bugsChannelEmbed] }).catch(internalErr => console.log("internal error\n", internalErr));
        //send feedback to member
        return commandMessage.reply({
            embeds: [
                new MessageEmbed(
                    {
                        author: {
                            name: `Error on Command`,
                            icon_url: `https://www.iconfinder.com/data/icons/freecns-cumulus/32/519791-101_Warning-512.png`
                        },
                        title: prefix + commandImpl.keyword,
                        description: '**usage:** ' + prefix + commandImpl.usage,
                        fields: [{ name: `Specified error  💥`, value: `• ${err}` }],
                        footer: { text: commandImpl.getAliases().toString() },
                        color: "RED"
                    })
            ]
        }
        )
            .then(msg => setTimeout(() => {
                msg.delete().catch()
            }, 30000));

    }

    protected helpCmd(message: Message, providedCommand: GenericCommand): Promise<Message> {
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
