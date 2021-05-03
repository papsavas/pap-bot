"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditMessageCmdImpl = void 0;
const Discord = require("discord.js");
const keywords_json_1 = require("../../keywords.json");
const guides_json_1 = require("../../guides.json");
const Inversify_1 = require("Inversify");
const AbstractCommand_1 = require("../AbstractCommand");
const e = require("../../../errorCodes.json");
let EditMessageCmdImpl = class EditMessageCmdImpl extends AbstractCommand_1.AbstractCommand {
    constructor() {
        super(...arguments);
        this._aliases = this.addKeywordToAliases(['editmessage', 'messageedit', 'messagedit', 'editmsg', 'msgedit'], keywords_json_1.editMessage);
    }
    getCommandData() {
        return {
            name: keywords_json_1.editMessage,
            description: this.getGuide(),
            options: [
                {
                    name: 'channel',
                    description: 'target channel',
                    type: 'CHANNEL',
                    required: true
                },
                {
                    name: 'message_id',
                    description: 'the id of the message',
                    type: 'STRING',
                    required: true
                },
                {
                    name: 'edit',
                    description: 'new message',
                    type: 'STRING',
                    required: true
                }
            ]
        };
    }
    async interactiveExecute(interaction) {
        const targetChannel = interaction.options[0].channel;
        const messageID = interaction.options[1].value;
        await interaction.defer(true);
        const targetMessage = await targetChannel?.messages.fetch(messageID);
        if (targetMessage.author != interaction.client.user)
            return interaction.reply('Cannot edit a message authored by another user');
        const editedMessage = await targetMessage?.edit(interaction.options[2].value);
        return interaction.editReply(new Discord.MessageEmbed({
            description: `[edited message](${editedMessage.url})`
        }));
    }
    async execute({ channel, mentions, guild, url }, { arg1, arg2, commandless2, commandless3 }, addGuildLog) {
        try {
            const fetchedMessage = await channel.messages.fetch(arg1);
            const editedMessage = await fetchedMessage
                .edit(commandless2);
            await channel.send({
                embed: {
                    description: `[edited message](${editedMessage.url})`
                }
            });
            return new Promise((res, rej) => res('edit message success'));
        }
        catch (err) {
            if (err.code == e["Unknown message"] || err.code == e["Invalid form body"]) {
                try {
                    const targetChannel = guild.channels.cache
                        .find(c => c.id == mentions.channels?.firstKey());
                    const targetMessage = await targetChannel?.messages.fetch(arg2);
                    const editedMessage = await targetMessage?.edit(commandless3);
                    const sendLinkMessage = await channel.send(new Discord.MessageEmbed({ description: `[edited message](${editedMessage.url})` }));
                    return new Promise((res, rej) => res('edit message success'));
                }
                catch (err) {
                    return new Promise((res, rej) => rej(`edit message failed\n${url}`));
                }
            }
            else {
                return new Promise((res, rej) => rej(`edit message failed\nreason:${err.toString()}`));
            }
        }
    }
    getAliases() {
        return this._aliases;
    }
    getGuide() {
        return guides_json_1.GeditMessage;
    }
    getKeyword() {
        return keywords_json_1.editMessage;
    }
};
EditMessageCmdImpl = __decorate([
    Inversify_1.injectable()
], EditMessageCmdImpl);
exports.EditMessageCmdImpl = EditMessageCmdImpl;
