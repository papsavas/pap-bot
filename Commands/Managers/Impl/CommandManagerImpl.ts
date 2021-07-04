import {
    ApplicationCommand, ApplicationCommandData, ApplicationCommandManager,
    Collection, CommandInteraction, GuildApplicationCommandManager, Message, MessageEmbed
} from "discord.js";
import { bugsChannel, guildMap } from "../../..";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { overrideCommands } from "../../../Queries/Generic/Commands";
import { GenericCommand } from "../../GenericCommand";
import { CommandManager } from "../Interf/CommandManager";

export abstract class CommandManagerImpl implements CommandManager {
    readonly commands: GenericCommand[];
    protected readonly helpCommandData: ApplicationCommandData;
    abstract fetchCommandData(commands: GenericCommand[]): ApplicationCommandData[];
    abstract onManualCommand(message: Message): Promise<unknown>;
    abstract onSlashCommand(interaction: CommandInteraction): Promise<unknown>;

    constructor(commands: GenericCommand[]) {
        this.helpCommandData = {
            name: "help",
            description: "displays support for a certain command",
            options: [
                {
                    name: `command`,
                    description: `the specified command`,
                    type: 'STRING',
                    choices: commands.map(cmd => ({
                        name: cmd.keyword,
                        value: cmd.guide.substring(0, 99)
                    })),
                    required: true
                }
            ]
        }
    }

    async updateCommands(commandManager: ApplicationCommandManager | GuildApplicationCommandManager)
        : Promise<Collection<`${bigint}`, ApplicationCommand<{}>>> {
        const applicationCommands: ApplicationCommandData[] = this.fetchCommandData(this.commands);
        console.log(`guild commands changed. Refreshing...`);
        await commandManager.set([]); //remove previous 
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

            })
        ));
        console.log(`---${this.commands[0].type} commands updated---`);
        return newCommands;
    }

    protected sliceCommandLiterals(receivedMessage: Message): literalCommandType {
        const receivedMessageContent = receivedMessage.content;
        const fullCommand: string = receivedMessageContent.substr(guildMap.get(receivedMessage.guild.id)
            .getSettings().prefix.length); // Remove the prefix;
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
            .then(() => interaction.client.setTimeout(() => interaction.deleteReply().catch(), 20000))
            .catch();
        console.log(`Error on Command ${primaryCommandLiteral}\n${err.stack}`)
    }


    protected invalidCommand(err: Error, commandMessage: Message, commandImpl: GenericCommand, primaryCommandLiteral: string) {
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
