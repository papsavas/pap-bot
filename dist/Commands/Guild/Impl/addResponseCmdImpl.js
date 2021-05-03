"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddResponseCmdImpl = void 0;
const keywords_json_1 = require("../../keywords.json");
const guides_json_1 = require("../../guides.json");
const Inversify_1 = require("Inversify");
const AbstractCommand_1 = require("../AbstractCommand");
const discord_js_1 = require("discord.js");
const loadSwearWords_1 = require("../../../Queries/Generic/loadSwearWords");
const MemberResponses_1 = require("../../../Queries/Generic/MemberResponses");
const profanity = require('profanity-js');
const Profanity = new profanity();
let AddResponseCmdImpl = class AddResponseCmdImpl extends AbstractCommand_1.AbstractCommand {
    constructor() {
        super(...arguments);
        this._aliases = this.addKeywordToAliases(['addresponse', 'add_response', 'ar'], keywords_json_1.addresponse);
    }
    getCommandData() {
        return {
            name: keywords_json_1.addresponse,
            description: this.getGuide(),
            options: [
                {
                    name: 'response',
                    description: 'your response',
                    type: 'STRING',
                    required: true
                }
            ]
        };
    }
    async interactiveExecute(interaction) {
        const memberResponse = interaction.options[0].value;
        const guildID = interaction.guildID;
        const memberID = interaction.member.user.id;
        const swears = await loadSwearWords_1.loadSwearWords();
        const nsfw = swears.some((swear) => memberResponse.includes(swear['swear_word'])) ||
            Profanity.isProfane(memberResponse);
        await interaction.defer(true);
        await MemberResponses_1.addMemberResponse(guildID, memberID, memberResponse, nsfw);
        return interaction.editReply(new discord_js_1.MessageEmbed({
            title: `Response Added`,
            description: ` your response has been added`,
            fields: [
                { name: `response`, value: `\`\`\`${memberResponse}\`\`\`` },
                { name: `marked as nsfw`, value: nsfw.toString() }
            ]
        }));
    }
    async execute(receivedMessage, receivedCommand, addGuildLog) {
        const swears = await loadSwearWords_1.loadSwearWords();
        const nsfw = swears.some((swear) => receivedMessage.content.includes(swear['swear_word'])) ||
            Profanity.isProfane(receivedMessage.cleanContent);
        return MemberResponses_1.addMemberResponse(receivedMessage.guild.id, receivedMessage.member.id, receivedCommand.commandless1, nsfw);
    }
    getKeyword() {
        return keywords_json_1.addresponse;
    }
    getAliases() {
        return this._aliases;
    }
    getGuide() {
        return guides_json_1.Gaddresponse;
    }
};
AddResponseCmdImpl = __decorate([
    Inversify_1.injectable()
], AddResponseCmdImpl);
exports.AddResponseCmdImpl = AddResponseCmdImpl;
