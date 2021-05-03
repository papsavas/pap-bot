"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PinMessageCmdImpl = void 0;
const guides_json_1 = require("../../guides.json");
const keywords_json_1 = require("../../keywords.json");
const Inversify_1 = require("Inversify");
const AbstractCommand_1 = require("../AbstractCommand");
const toolbox_1 = require("../../../toolbox/toolbox");
const discord_js_1 = require("discord.js");
const e = require("../../../errorCodes.json");
let PinMessageCmdImpl = class PinMessageCmdImpl extends AbstractCommand_1.AbstractCommand {
    constructor() {
        super(...arguments);
        this._aliases = this.addKeywordToAliases(['pin', 'πιν'], keywords_json_1.pinMessage);
    }
    getCommandData() {
        return {
            name: keywords_json_1.pinMessage,
            description: this.getGuide(),
            options: [
                {
                    name: 'message_id',
                    description: 'targeted message id or link',
                    type: 'STRING',
                    required: true
                },
                {
                    name: 'reason',
                    description: 'reason for pinning',
                    type: 'STRING',
                    required: false
                }
            ]
        };
    }
    async interactiveExecute(interaction) {
        const channel = interaction.channel;
        const reason = interaction.options[1];
        const member = interaction.member;
        let pinReason = reason ? reason.value : ``;
        pinReason += `\nby ${member.displayName}`;
        let pinningMessageID = toolbox_1.extractId(interaction.options[0].value);
        let fetchedMessage;
        try {
            fetchedMessage = await channel.messages.fetch(pinningMessageID);
        }
        catch (error) {
            if (error.code == e["Unknown message"])
                return interaction.reply(`*invalid message id. Message needs to be of channel ${channel.toString()}*`, { ephemeral: true });
        }
        return fetchedMessage.pin({ reason: pinReason })
            .then((pinnedMessage) => {
            //addGuildLog(`message pinned:\n${pinnedMessage.url} with reason ${pinReason}`);
            interaction.reply(new discord_js_1.MessageEmbed({
                title: `Pinned Message 📌`,
                description: pinnedMessage.content?.length > 0 ?
                    `[${pinnedMessage.content.substring(0, 100)}...](${pinnedMessage.url})` :
                    `[Click to jump](${pinnedMessage.url})`,
                footer: { text: pinReason }
            }));
        })
            .catch(err => {
            interaction.reply('could not pin message');
        });
    }
    execute(message, { arg1, commandless2 }, addGuildLog) {
        const channel = message.channel;
        let pinReason = commandless2 ? commandless2 : ``;
        pinReason += `\nby ${message.member.displayName}`;
        let pinningMessageID = toolbox_1.extractId(arg1);
        return channel.messages.fetch(pinningMessageID)
            .then((fetchedMessage) => {
            fetchedMessage.pin({ reason: pinReason })
                .then((pinnedMessage) => {
                //addGuildLog(`message pinned:\n${pinnedMessage.url} with reason ${pinReason}`);
                if (message.deletable)
                    message.client.setTimeout(() => message.delete().catch(), 3000);
            });
        });
    }
    getAliases() {
        return this._aliases;
    }
    getGuide() {
        return guides_json_1.GpinMessage;
    }
    getKeyword() {
        return keywords_json_1.pinMessage;
    }
};
PinMessageCmdImpl = __decorate([
    Inversify_1.injectable()
], PinMessageCmdImpl);
exports.PinMessageCmdImpl = PinMessageCmdImpl;
