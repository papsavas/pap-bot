"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageChannelCmdImpl = void 0;
const Discord = require("discord.js");
const keywords_json_1 = require("../../keywords.json");
const guides_json_1 = require("../../guides.json");
const Inversify_1 = require("Inversify");
const AbstractCommand_1 = require("../AbstractCommand");
let MessageChannelCmdImpl = class MessageChannelCmdImpl extends AbstractCommand_1.AbstractCommand {
    constructor() {
        super(...arguments);
        this._aliases = this.addKeywordToAliases(['send', 'msgchannel', 'messagechannel', 'message_channel'], keywords_json_1.messageChannel);
    }
    getCommandData() {
        return {
            name: keywords_json_1.messageChannel,
            description: this.getGuide(),
            options: [
                {
                    name: 'channel',
                    description: 'targeted channel',
                    type: 'CHANNEL',
                    required: true
                },
                {
                    name: 'message',
                    description: 'the message',
                    type: 'STRING',
                    required: true
                }
            ]
        };
    }
    async interactiveExecute(interaction) {
        const sendChannel = interaction.options[0].channel;
        const messageContent = interaction.options[1].value;
        await sendChannel.send(messageContent, { split: true });
        const emb = new Discord.MessageEmbed({
            title: `Message send`,
            fields: [
                { name: `target`, value: sendChannel.toString() },
                { name: `message`, value: messageContent.substr(0, 1023) }
            ]
        });
        return interaction.reply({
            embeds: [emb],
            ephemeral: true
        });
    }
    async execute({ guild, mentions }, { commandless2 }, addGuildLog) {
        const sendChannel = mentions.channels.first();
        if (guild.channels.cache.has(sendChannel?.id) && sendChannel?.type === 'text')
            return sendChannel.send(commandless2)
                .then(() => addGuildLog(`sent ${commandless2} to ${sendChannel.name}`));
        else
            throw new Error(`Channel not found`);
    }
    getAliases() {
        return this._aliases;
    }
    getGuide() {
        return guides_json_1.GmessageChannel;
    }
    getKeyword() {
        return keywords_json_1.messageChannel;
    }
};
MessageChannelCmdImpl = __decorate([
    Inversify_1.injectable()
], MessageChannelCmdImpl);
exports.MessageChannelCmdImpl = MessageChannelCmdImpl;
