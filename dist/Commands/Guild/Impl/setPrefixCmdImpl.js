"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetPrefixCmdImpl = void 0;
const inversify_1 = require("inversify");
const AbstractCommand_1 = require("../AbstractCommand");
const keywords_json_1 = require("../../keywords.json");
const guides_json_1 = require("../../guides.json");
const GuildSettings_1 = require("../../../Queries/Generic/GuildSettings");
const index_1 = require("../../../index");
let SetPrefixCmdImpl = class SetPrefixCmdImpl extends AbstractCommand_1.AbstractCommand {
    constructor() {
        super(...arguments);
        this._aliases = this.addKeywordToAliases(['prefix', 'setprefix'], keywords_json_1.setPrefix);
    }
    getCommandData() {
        return {
            name: keywords_json_1.setPrefix,
            description: this.getGuide(),
            options: [
                {
                    name: 'prefix',
                    description: 'new prefix',
                    type: 'STRING',
                    required: true
                }
            ]
        };
    }
    async interactiveExecute(interaction) {
        const guildHandler = index_1.guildMap.get(interaction.guildID);
        const newPrefix = interaction.options[0].value;
        await interaction.defer();
        if (!!newPrefix) {
            const oldSettings = await GuildSettings_1.fetchGuildSettings(interaction.guildID);
            const newSettings = Object.assign(oldSettings, { 'prefix': newPrefix });
            await GuildSettings_1.updateGuildSettings(interaction.guildID, newSettings).then(() => guildHandler.setPrefix(newPrefix));
            return interaction.editReply(`new prefix is set to \`${newPrefix}\``);
        }
        else
            return interaction.editReply(`Current prefix is \`${guildHandler.getSettings().prefix}\``);
    }
    execute(receivedMessage, receivedCommand, addGuildLog) {
        const guildHandler = index_1.guildMap.get(receivedMessage.guild.id);
        if (receivedCommand.arg1)
            return GuildSettings_1.fetchGuildSettings(receivedMessage.guild.id)
                .then(async (oldSettings) => {
                const newSettings = Object.assign(oldSettings, { 'prefix': receivedCommand.arg1 });
                return GuildSettings_1.updateGuildSettings(receivedMessage.guild.id, newSettings).then(() => guildHandler.setPrefix(receivedCommand.arg1));
            });
        else
            return receivedMessage.reply(`Current prefix is "${guildHandler.getSettings().prefix}"`, { code: true });
    }
    getKeyword() {
        return keywords_json_1.setPrefix;
    }
    getAliases() {
        return this._aliases;
    }
    getGuide() {
        return guides_json_1.GsetPrefix;
    }
};
SetPrefixCmdImpl = __decorate([
    inversify_1.injectable()
], SetPrefixCmdImpl);
exports.SetPrefixCmdImpl = SetPrefixCmdImpl;
