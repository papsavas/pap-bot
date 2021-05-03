"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowPersonalResponsesCmdImpl = void 0;
const inversify_1 = require("inversify");
const AbstractCommand_1 = require("../AbstractCommand");
const keywords_json_1 = require("../../keywords.json");
const guides_json_1 = require("../../guides.json");
const discord_js_1 = require("discord.js");
const MemberResponses_1 = require("../../../Queries/Generic/MemberResponses");
const paginatedEmbed_1 = require("../../../toolbox/paginatedEmbed");
let ShowPersonalResponsesCmdImpl = class ShowPersonalResponsesCmdImpl extends AbstractCommand_1.AbstractCommand {
    constructor() {
        super(...arguments);
        this._aliases = this.addKeywordToAliases(['myresponses', 'my_responses', 'responses', 'myresp', 'myresps'], keywords_json_1.myresponses);
    }
    getCommandData() {
        return {
            name: keywords_json_1.myresponses,
            description: this.getGuide()
        };
    }
    interactiveExecute(interaction) {
        return interaction.reply('coming soon');
    }
    async execute(receivedMessage, receivedCommand, addGuildLog) {
        const guild_id = receivedMessage.guild.id;
        const member_id = receivedMessage.member.id;
        const perPage = 10;
        const timeout = 60000;
        const responses = await MemberResponses_1.fetchGuildMemberResponses(guild_id, member_id);
        const responsesArr = responses.map(resObj => resObj['response']);
        const fieldBuilder = (resp, index, start) => [start + index + 1 + ')', resp];
        const headerEmbed = new discord_js_1.MessageEmbed({
            author: {
                name: receivedMessage.member.displayName,
                iconURL: receivedMessage.member.user.avatarURL({ format: 'png' })
            },
            title: `Your Added Responses ✍ 💬`,
            color: `#fcfcfc`,
            footer: { text: this.getAliases().toString() }
        });
        return paginatedEmbed_1.paginationEmbed(receivedMessage, responsesArr, perPage, headerEmbed, fieldBuilder, timeout);
    }
    getKeyword() {
        return keywords_json_1.myresponses;
    }
    getAliases() {
        return this._aliases;
    }
    getGuide() {
        return guides_json_1.Gmyresponses;
    }
};
ShowPersonalResponsesCmdImpl = __decorate([
    inversify_1.injectable()
], ShowPersonalResponsesCmdImpl);
exports.ShowPersonalResponsesCmdImpl = ShowPersonalResponsesCmdImpl;
