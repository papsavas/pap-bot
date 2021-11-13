import {
    ApplicationCommand, ApplicationCommandData, ApplicationCommandDataResolvable, ApplicationCommandManager,
    ApplicationCommandResolvable,
    BaseCommandInteraction,
    Collection, CommandInteraction, Constants, GuildApplicationCommandManager, Message, MessageEmbed, Snowflake
} from "discord.js";
import { prefix as defaultPrefix } from "../../../../bot.config.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { bugsChannel, guildMap } from "../../../index";
import { fetchCommandID, fetchCommandPerms } from "../../../Queries/Generic/Commands";
import { GenericCommand } from "../../GenericCommand";
import { CommandManager } from "../Interf/CommandManager";

export abstract class CommandManagerImpl implements CommandManager {
    readonly commands: GenericCommand[];
    protected readonly helpCommandData: ApplicationCommandData;
    abstract fetchCommandData(commands: GenericCommand[]): ApplicationCommandData[];
    abstract saveCommandData(commands: Collection<Snowflake, ApplicationCommand>): Promise<unknown>;
    abstract clearCommands(
        commandManager: ApplicationCommandManager | GuildApplicationCommandManager
    ): Promise<unknown>;

    constructor(commands: GenericCommand[]) {
        this.helpCommandData = {
            name: `help_${commands[0].type.toString().toLowerCase()}`,
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
                    })).slice(-25), //Discord API supports up to 25 choices
                    required: true
                }
            ]
        }
    }


    onSlashCommand(interaction: BaseCommandInteraction): Promise<unknown> {
        //TODO: fetch command to access "usage"
        if (interaction.commandName.startsWith('help'))
            return interaction.reply({
                embeds: [
                    new MessageEmbed({
                        description: (interaction as CommandInteraction).options.getString('command')
                    })
                ]
                , ephemeral: true
            }).catch(err => this.invalidSlashCommand(err, interaction, 'help'))


        const candidateCommand = this.commands
            .find((cmds: GenericCommand) => cmds.matchAliases(interaction.commandName))
        if (typeof candidateCommand !== "undefined")
            return candidateCommand.interactiveExecute(interaction)
                .catch(err => this.invalidSlashCommand(err, interaction, interaction.commandName));
        else
            return interaction.reply(`Command \`${interaction.commandName}\` not found`);
    };

    async onManualCommand(message: Message): Promise<unknown> {
        const guildHandler = guildMap.get(message.guild?.id);
        const prefix = guildHandler?.getSettings().prefix ?? defaultPrefix;
        const commandMessage = message;
        const candidateCommand = this.sliceCommandLiterals(message, prefix);
        const commandImpl: GenericCommand = this.commands
            .find((cmds: GenericCommand) => cmds.matchAliases(candidateCommand?.primaryCommand));

        if (typeof commandImpl !== "undefined") {
            if (Boolean(message.guild)) {
                const perms = await fetchCommandPerms(message.guildId, commandImpl.id.findKey(v => v === message.guildId));
                if (perms.length !== 0 && !perms.map(p => p.role_id).some(pr => message.member.roles.cache.has(pr)))
                    return message.react('⛔');
            }
            let emote: string;
            try {
                await commandImpl.execute(commandMessage, candidateCommand);
                emote = '✅';
            } catch (error) {
                this.invalidCommand(error, commandMessage, commandImpl, candidateCommand.primaryCommand, prefix);
                emote = '❌';
            }
            return commandMessage.react(emote)
                .then(reaction => reaction.users.remove(reaction.client.user.id))
                .catch(err => err.code === Constants.APIErrors.UNKNOWN_MESSAGE ? '' : new Error(err));
        }

        else if (['help', 'h'].includes(candidateCommand.primaryCommand))
            return this.manualHelpCmd(
                message,
                this.commands
                    .find((cmds: GenericCommand) => cmds.matchAliases(candidateCommand?.arg1)));
        else
            return message.react('❔').catch();
    };

    async editCommand(
        commandManager: ApplicationCommandManager | GuildApplicationCommandManager,
        command: ApplicationCommandResolvable,
        data: ApplicationCommandData,
        guildId?: Snowflake
    ): Promise<ApplicationCommand> {
        const cmd = commandManager instanceof GuildApplicationCommandManager ?
            await commandManager.edit(command, data) : await commandManager.edit(command, data, guildId);
        await this.saveCommandData(new Collection([[cmd.id, cmd]]));
        return cmd;
    }

    async updateCommands(commandManager: ApplicationCommandManager) {
        if (this.commands.length > 25)
            throw `Commands Exceed max size (25). Size: ${this.commands.length}`
        const applicationCommands: ApplicationCommandData[] = this.fetchCommandData(this.commands);
        console.log(`updating ${this.commands[0].type} commands`);
        applicationCommands.push(this.helpCommandData);
        const newCommands = await commandManager.set(applicationCommands);
        await this.saveCommandData(newCommands); //DB
        for (const cmd of this.commands) {
            cmd.id = await fetchCommandID(cmd.keyword);
        }
        console.log(`---${this.commands[0].type} commands updated---`);
        return newCommands;
    }

    async registerCommand(commandManager: ApplicationCommandManager, command: ApplicationCommandDataResolvable) {
        const cmd = await commandManager.create(command);
        await this.saveCommandData(new Collection<Snowflake, ApplicationCommand>().set(cmd.id, cmd));
        return cmd;
    }

    //TODO: implement `removeCommand()`

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
            primaryCommand: splitCommand[0],
            arg1: splitCommand[1],
            arg2: splitCommand[2],
            arg3: splitCommand[3],
            commandless1: splitCommand.slice(1).join(' '),
            commandless2: splitCommand.slice(2).join(' '),
            commandless3: splitCommand.slice(3).join(' ')
        }
    }

    //TODO: fix this mess
    protected invalidSlashCommand(err: Error, interaction: BaseCommandInteraction, primaryCommandLiteral: string) {
        const bugsChannelEmbed = new MessageEmbed({
            author: {
                name: interaction.guild?.name ?? interaction.user.username,
                icon_url: "https://icon-library.com/images/error-icon-transparent/error-icon-transparent-13.jpg"
            },
            thumbnail: {
                proxy_url: interaction.guild?.iconURL({ format: "png", size: 512 }) ?? interaction.user.avatarURL({ format: "png", size: 512 }),
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
                title: interaction.commandName,
                fields: [{ name: `Specified error  💥`, value: `• ${err}` }],
                color: 'RED'
            })

        //send feedback to member
        const interactionPromise: Promise<unknown> = interaction.replied || interaction.deferred ?
            interaction.followUp({
                embeds: [interactionEmb],
                ephemeral: true
            }) :
            interaction.reply({
                ephemeral: true,
                embeds: [interactionEmb]
            });
        interactionPromise
            .catch(console.error);
        console.log(`Error on Command ${primaryCommandLiteral}\n${err.stack}`)
    }


    //TODO: fix this mess
    protected async invalidCommand(
        err: Error, commandMessage: Message,
        commandImpl: GenericCommand,
        primaryCommandLiteral: string,
        prefix: string
    ) {
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
        bugsChannelEmbed.addField(`caused by`, commandMessage?.url);
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

    protected manualHelpCmd(message: Message, providedCommand: GenericCommand): Promise<Message> {
        if (typeof providedCommand !== 'undefined')
            return message.reply({
                embeds:
                    [
                        new MessageEmbed({
                            title: providedCommand.keyword,
                            description: providedCommand.guide,
                            fields: [{ name: "Usage", value: providedCommand.usage, inline: true }],
                            footer: { text: providedCommand.getAliases().toString() }
                        })
                    ]
            })
        else
            return message.reply(`command not found`);
    }
}
