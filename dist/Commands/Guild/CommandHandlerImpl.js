"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const Inversify_1 = require("Inversify");
const Discord = require("discord.js");
const Types_1 = require("../../Inversify/Types");
const index_1 = require("../../index");
require('dotenv').config();
let CommandHandlerImpl = class CommandHandlerImpl {
    constructor(helpCmd, pollCmd, dmMemberCmd, messageChannelCmd, pinMessageCmd, unpinMessageCmd, editMessageCmd, setPrefixCmd, setPermsCmd, showPermsCmd, addResponseCmd, showPersonalResponsesCmd, clearMessagesCmd, removePersonalResponseCmd, mockMessageCmd, nsfwSwitchCmd) {
        this.commands = [
            helpCmd, pollCmd, dmMemberCmd, setPrefixCmd,
            pinMessageCmd, unpinMessageCmd,
            messageChannelCmd, clearMessagesCmd, editMessageCmd,
            setPermsCmd, showPermsCmd,
            addResponseCmd, showPersonalResponsesCmd, removePersonalResponseCmd,
            mockMessageCmd, nsfwSwitchCmd
        ];
    }
    async registerApplicationCommands(commandManager) {
        for (const command of this.commands) {
            try {
                await commandManager.create(command.getCommandData());
            }
            catch (error) {
                console.log(command.getKeyword(), error);
            }
        }
        return Promise.resolve('slash commands created');
    }
    getGuildLogger() {
        return this._guildLogger;
    }
    onCommand(message) {
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
        const guildHandler = index_1.guildMap.get(message.guild.id);
        const prefix = guildHandler.getSettings().prefix;
        const commandMessage = message;
        const candidateCommand = this.returnCommand(message);
        this.setGuildLogger(message.guild.id);
        const commandImpl = this.commands.find((cmds) => cmds.matchAliases(candidateCommand?.primaryCommand));
        if (typeof commandImpl !== "undefined") {
            return commandImpl.execute(commandMessage, candidateCommand, this.getGuildLogger())
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
            /*
            switch (prefix) {
                case prefix:


                case qprefix:
                    return message.channel.send(commandImpl.getGuide())
                        .catch(err => `Error on Guide sending\n${err.toString()}`);
            }*/
        }
        else
            return message.react('❔').catch();
    }
    onSlashCommand(interaction) {
        return this.commands.find((cmds) => cmds.matchAliases(interaction.commandName))
            .interactiveExecute(interaction)
            .catch(err => this.invalidSlashCommand(err, interaction, interaction.commandName));
    }
    setGuildLogger(guildID) {
        this._guildLogger = index_1.guildMap.get(guildID).addGuildLog;
    }
    returnCommand(receivedMessage) {
        const receivedMessageContent = receivedMessage.content;
        //const prefix: string = receivedMessageContent.charAt(0);
        const fullCommand = receivedMessageContent.substr(index_1.guildMap.get(receivedMessage.guild.id).getSettings().prefix.length); // Remove the prefix;
        const splitCommand = fullCommand.split(/(\s+)/).filter(e => e.trim().length > 0); //split command from space(s);
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
        };
    }
    invalidSlashCommand(err, interaction, primaryCommandLiteral) {
        const bugsChannelEmbed = new Discord.MessageEmbed({
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
        index_1.bugsChannel.send(bugsChannelEmbed).catch(internalErr => console.log("internal error\n", internalErr));
        //send feedback to member
        const interactionEmb = new Discord.MessageEmbed({
            author: {
                name: `Error on Command`,
                icon_url: `https://www.iconfinder.com/data/icons/freecns-cumulus/32/519791-101_Warning-512.png`
            },
            title: index_1.guildMap.get(interaction.guild.id).getSettings().prefix + interaction.commandName,
            fields: [{ name: `Specified error  💥`, value: `• ${err}` }],
            color: "RED"
        });
        const interactionPromise = interaction.replied ?
            interaction.editReply(interactionEmb) : interaction.reply(interactionEmb);
        interactionPromise
            .then(() => interaction.client.setTimeout(() => interaction.deleteReply().catch(), 15000))
            .catch();
        console.log(`Error on Command ${primaryCommandLiteral}\n${err.stack}`);
    }
    invalidCommand(err, commandMessage, commandImpl, primaryCommandLiteral) {
        const bugsChannelEmbed = new Discord.MessageEmbed({
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
        index_1.bugsChannel.send(bugsChannelEmbed).catch(internalErr => console.log("internal error\n", internalErr));
        //send feedback to member
        commandMessage.reply(new Discord.MessageEmbed({
            author: {
                name: `Error on Command`,
                icon_url: `https://www.iconfinder.com/data/icons/freecns-cumulus/32/519791-101_Warning-512.png`
            },
            title: index_1.guildMap.get(commandMessage.guild.id).getSettings().prefix + commandImpl.getKeyword(),
            description: commandImpl.getGuide(),
            fields: [{ name: `Specified error  💥`, value: `• ${err}` }],
            footer: { text: commandImpl.getAliases().toString() },
            color: "RED"
        })).then(msg => msg.client.setTimeout(() => msg.delete(), 15000));
        console.log(`Error on Command ${primaryCommandLiteral}\n${err.stack}`);
    }
};
CommandHandlerImpl = __decorate([
    Inversify_1.injectable(),
    __param(0, Inversify_1.inject(Types_1.TYPES.HelpCmd)),
    __param(1, Inversify_1.inject(Types_1.TYPES.PollCmd)),
    __param(2, Inversify_1.inject(Types_1.TYPES.DmMemberCmd)),
    __param(3, Inversify_1.inject(Types_1.TYPES.MessageChannelCmd)),
    __param(4, Inversify_1.inject(Types_1.TYPES.PinMessageCmd)),
    __param(5, Inversify_1.inject(Types_1.TYPES.UnpinMessageCmd)),
    __param(6, Inversify_1.inject(Types_1.TYPES.EditMessageCmd)),
    __param(7, Inversify_1.inject(Types_1.TYPES.SetPrefixCmd)),
    __param(8, Inversify_1.inject(Types_1.TYPES.SetPermsCmd)),
    __param(9, Inversify_1.inject(Types_1.TYPES.ShowPermsCmd)),
    __param(10, Inversify_1.inject(Types_1.TYPES.AddResponseCmd)),
    __param(11, Inversify_1.inject(Types_1.TYPES.ShowPersonalResponsesCmd)),
    __param(12, Inversify_1.inject(Types_1.TYPES.ClearMessagesCmd)),
    __param(13, Inversify_1.inject(Types_1.TYPES.RemovePersonalResponseCmd)),
    __param(14, Inversify_1.inject(Types_1.TYPES.MockMessageCmd)),
    __param(15, Inversify_1.inject(Types_1.TYPES.NsfwSwitchCmd))
], CommandHandlerImpl);
exports.default = CommandHandlerImpl;
