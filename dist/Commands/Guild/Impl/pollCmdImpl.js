"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollCmdImpl = void 0;
const AbstractCommand_1 = require("../AbstractCommand");
const Discord = require("discord.js");
const keywords_json_1 = require("../../keywords.json");
const guides_json_1 = require("../../guides.json");
const Inversify_1 = require("Inversify");
let PollCmdImpl = class PollCmdImpl extends AbstractCommand_1.AbstractCommand {
    constructor() {
        super(...arguments);
        this._aliases = this.addKeywordToAliases(['poll', 'πολλ'], keywords_json_1.simplePoll);
    }
    getCommandData() {
        return {
            name: keywords_json_1.simplePoll,
            description: this.getGuide(),
            options: [
                {
                    name: 'text',
                    description: 'text to poll',
                    type: 'STRING',
                    required: true
                }
            ]
        };
    }
    async interactiveExecute(interaction) {
        const channel = interaction.channel;
        const member = interaction.member;
        return channel.send(new Discord.MessageEmbed({
            title: `Ψηφίστε`,
            color: '#D8F612',
            description: interaction.options[0].value,
            author: {
                name: member.displayName,
                icon_url: member.user.avatarURL({ format: 'png' })
            },
            //add blank
            fields: [{
                    name: '\u200B',
                    value: '\u200B',
                },],
            footer: { text: 'Poll📊' }
        }))
            .then((botmsg) => {
            botmsg.react('👍');
            botmsg.react('👎');
            interaction.reply('poll created', { ephemeral: true })
                .then(() => interaction.deleteReply());
        });
    }
    execute(message, { commandless1 }, addGuildLog) {
        const commandMsg = message;
        return commandMsg.channel.send(new Discord.MessageEmbed({
            title: `Ψηφίστε`,
            color: '#D8F612',
            description: commandless1,
            author: {
                name: commandMsg.member.displayName,
                icon_url: commandMsg.member.user.avatarURL({ format: 'png' })
            },
            //add blank
            fields: [{
                    name: '\u200B',
                    value: '\u200B',
                },],
            footer: { text: 'Poll📊' }
        }))
            .then((botmsg) => {
            botmsg.react('👍');
            botmsg.react('👎');
            if (commandMsg.deletable)
                commandMsg.delete()
                    .catch(err => {
                    //this.logErrorOnBugsChannel(err, bundle);
                });
        });
    }
    getKeyword() {
        return keywords_json_1.simplePoll;
    }
    getAliases() {
        return this._aliases;
    }
    getGuide() {
        return guides_json_1.GsimplePoll;
    }
};
PollCmdImpl = __decorate([
    Inversify_1.injectable()
], PollCmdImpl);
exports.PollCmdImpl = PollCmdImpl;
