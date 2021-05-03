"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NsfwSwitchCmdImpl = void 0;
const keywords_json_1 = require("../../keywords.json");
const guides_json_1 = require("../../guides.json");
const Inversify_1 = require("Inversify");
const AbstractCommand_1 = require("../AbstractCommand");
const GuildSettings_1 = require("../../../Queries/Generic/GuildSettings");
const __1 = require("../../..");
let NsfwSwitchCmdImpl = class NsfwSwitchCmdImpl extends AbstractCommand_1.AbstractCommand {
    constructor() {
        super(...arguments);
        this._aliases = this.addKeywordToAliases(['nsfw', 'nsfwswitch'], keywords_json_1.nsfwSwitch);
    }
    getCommandData() {
        return {
            name: keywords_json_1.nsfwSwitch,
            description: this.getGuide()
        };
    }
    async interactiveExecute(interaction) {
        const oldSettings = await GuildSettings_1.fetchGuildSettings(interaction.guildID);
        const literal = oldSettings.nsfw_responses ? "Disabled" : "Enabled";
        await interaction.defer();
        await GuildSettings_1.updateGuildSettings(interaction.guildID, Object.assign(oldSettings, { "nsfw_responses": !oldSettings.nsfw_responses }));
        await __1.guildMap.get(interaction.guildID).loadResponses();
        return interaction.editReply(`**${literal}** \`nsfw\` mode`);
    }
    async execute(message, {}, addGuildLog) {
        try {
            const oldSettings = await GuildSettings_1.fetchGuildSettings(message.guild.id);
            const literal = oldSettings.nsfw_responses ? "Disabled" : "Enabled";
            await message.reply(`**${literal}** \`nsfw\` mode`);
            await GuildSettings_1.updateGuildSettings(message.guild.id, Object.assign(oldSettings, { "nsfw_responses": !oldSettings.nsfw_responses }));
            await __1.guildMap.get(message.guild.id).loadResponses();
            return Promise.resolve();
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    getAliases() {
        return this._aliases;
    }
    getGuide() {
        return guides_json_1.GnsfwSwitch;
    }
    getKeyword() {
        return keywords_json_1.nsfwSwitch;
    }
};
NsfwSwitchCmdImpl = __decorate([
    Inversify_1.injectable()
], NsfwSwitchCmdImpl);
exports.NsfwSwitchCmdImpl = NsfwSwitchCmdImpl;
