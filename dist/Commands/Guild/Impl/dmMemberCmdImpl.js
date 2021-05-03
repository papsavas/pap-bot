"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DmMemberCmdImpl = void 0;
const keywords_json_1 = require("../../keywords.json");
const guides_json_1 = require("../../guides.json");
const Inversify_1 = require("Inversify");
const AbstractCommand_1 = require("../AbstractCommand");
const e = require("../../../errorCodes.json");
const Discord = require("discord.js");
let DmMemberCmdImpl = class DmMemberCmdImpl extends AbstractCommand_1.AbstractCommand {
    constructor() {
        super(...arguments);
        this._aliases = this.addKeywordToAliases(['directmessage', 'message', 'dm'], keywords_json_1.dmMember);
    }
    getCommandData() {
        return {
            name: keywords_json_1.dmMember,
            description: this.getGuide(),
            options: [
                {
                    name: 'user',
                    description: 'user to dm',
                    type: 'USER',
                    required: true
                },
                {
                    name: 'message',
                    description: 'message to user',
                    type: 'STRING',
                    required: true
                }
            ]
        };
    }
    async interactiveExecute(interaction) {
        const user = interaction.options[0].user;
        const messageContent = interaction.options[1].value;
        const sendEmb = new Discord.MessageEmbed({
            author: {
                name: interaction.guild.name,
                //icon_url: `https://www.theindianwire.com/wp-content/uploads/2020/11/Google_Messages_logo.png`,
                //https://upload.wikimedia.org/wikipedia/commons/0/05/Google_Messages_logo.svg
            },
            title: `You have a message ${user.username}`,
            thumbnail: { url: interaction.guild.iconURL({ format: "png", size: 128 }) },
            color: "AQUA",
            description: messageContent,
            //video: { url: attachments?.proxyURL}, cannot send video via rich embed
            timestamp: new Date()
        });
        return user.send(sendEmb)
            .then((smsg) => interaction.reply(`message send to ${user.toString()}`, { ephemeral: true }))
            .catch(err => {
            if (err.code == e["Cannot send messages to this user"]) {
                interaction.reply(`Could not dm ${user.username}`);
            }
        });
    }
    async execute({ guild, attachments, mentions }, { commandless2 }, addGuildLog) {
        const user = mentions.users.first();
        const text = commandless2;
        if (!text && !attachments)
            throw new Error('Cannot send empty message');
        const sendEmb = new Discord.MessageEmbed({
            author: {
                name: guild.name,
                //icon_url: `https://www.theindianwire.com/wp-content/uploads/2020/11/Google_Messages_logo.png`,
                //https://upload.wikimedia.org/wikipedia/commons/0/05/Google_Messages_logo.svg
            },
            title: `You have a message ${user.username}`,
            thumbnail: { url: guild.iconURL({ format: "png", size: 128 }) },
            image: { url: attachments?.first().url },
            color: "AQUA",
            description: text,
            //video: { url: attachments?.proxyURL}, cannot send video via rich embed
            timestamp: new Date()
        });
        return user.send(sendEmb)
            .then((smsg) => addGuildLog(`sent "${text}" to ${user.username}`))
            .catch(err => {
            if (err.code == e["Cannot send messages to this user"]) {
                throw new Error(`Could not dm ${user.username}`);
            }
        });
    }
    getKeyword() {
        return keywords_json_1.dmMember;
    }
    getAliases() {
        return this._aliases;
    }
    getGuide() {
        return guides_json_1.GdmMember;
    }
};
DmMemberCmdImpl = __decorate([
    Inversify_1.injectable()
], DmMemberCmdImpl);
exports.DmMemberCmdImpl = DmMemberCmdImpl;
