"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClearMessagesCmdImpl = void 0;
const keywords_json_1 = require("../../keywords.json");
const guides_json_1 = require("../../guides.json");
const Inversify_1 = require("Inversify");
const AbstractCommand_1 = require("../AbstractCommand");
const discord_js_1 = require("discord.js");
let ClearMessagesCmdImpl = class ClearMessagesCmdImpl extends AbstractCommand_1.AbstractCommand {
    constructor() {
        super(...arguments);
        this._aliases = this.addKeywordToAliases(['clear', 'clean', 'purge'], keywords_json_1.clearMessages);
    }
    getCommandData() {
        return {
            name: keywords_json_1.clearMessages,
            description: this.getGuide(),
            options: [
                {
                    name: 'number',
                    description: 'number of message to delete',
                    type: 'INTEGER',
                    required: true
                }
            ]
        };
    }
    async interactiveExecute(interaction) {
        const number = interaction.options[0].value;
        const member = interaction.member;
        if (member.permissions.has(discord_js_1.Permissions.FLAGS.MANAGE_MESSAGES)) {
            const delMessages = await interaction.channel.bulkDelete(number);
            //addGuildLog(`${member.displayName} deleted ${number} messages in ${(channel as TextChannel).name}`);
            let descr = '';
            delMessages.array() /*.slice(1)*/.reverse().map(msg => {
                try {
                    if (!msg.content.startsWith('$clear') && msg.type !== 'APPLICATION_COMMAND')
                        descr += `**${msg.author.username}**: ${msg.content}\n`;
                }
                catch (err) {
                    descr += `**${msg.author.username}**: ???\n`;
                }
            });
            return interaction.reply({
                embeds: [{
                        title: `🗑️ Deleted ${number} messages`,
                        description: descr.substring(0, 2048)
                    }]
            });
        }
        else
            return interaction.reply('You need `MANAGE_MESSAGES` permissions', { ephemeral: true });
    }
    execute({ channel, member }, { arg1 }, addGuildLog) {
        const number = parseInt(arg1) == 100 ?
            100 : parseInt(arg1) == 0 ?
            0 : parseInt(arg1) + 1;
        if (isNaN(number))
            return Promise.reject(new Error(`You need to provide a number between 1-100`));
        if (member.permissions.has(discord_js_1.Permissions.FLAGS.MANAGE_MESSAGES))
            return channel.bulkDelete(number)
                .then(delMessages => {
                //addGuildLog(`${member.displayName} deleted ${number} messages in ${(channel as TextChannel).name}`);
                let descr = '';
                delMessages.array() /*.slice(1)*/.reverse().map(msg => {
                    try {
                        if (!msg.content.startsWith('$clear'))
                            descr += `**${msg.author.username}**: ${msg.content}\n`;
                    }
                    catch (err) {
                        descr += `**${msg.author.username}**: ???\n`;
                    }
                });
                if (descr.length > 2048)
                    return;
                return channel.send({
                    embed: {
                        title: `🗑️ Deleted ${number} messages`,
                        description: descr
                    }
                });
            })
                .catch();
        else
            return Promise.reject('Requires `MANAGE_MESSAGES` permission');
    }
    getKeyword() {
        return keywords_json_1.clearMessages;
    }
    getAliases() {
        return this._aliases;
    }
    getGuide() {
        return guides_json_1.GclearMessages;
    }
};
ClearMessagesCmdImpl = __decorate([
    Inversify_1.injectable()
], ClearMessagesCmdImpl);
exports.ClearMessagesCmdImpl = ClearMessagesCmdImpl;
