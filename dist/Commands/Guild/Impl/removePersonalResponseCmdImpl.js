"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemovePersonalResponseCmdImpl = void 0;
const keywords_json_1 = require("../../keywords.json");
const guides_json_1 = require("../../guides.json");
const Inversify_1 = require("Inversify");
const AbstractCommand_1 = require("../AbstractCommand");
const MemberResponses_1 = require("../../../Queries/Generic/MemberResponses");
let RemovePersonalResponseCmdImpl = class RemovePersonalResponseCmdImpl extends AbstractCommand_1.AbstractCommand {
    constructor() {
        super(...arguments);
        this._aliases = this.addKeywordToAliases(['removeresponse', 'rresponse', 'remove_response', 'rr'], keywords_json_1.showPerms);
    }
    getCommandData() {
        return {
            name: keywords_json_1.showPerms,
            description: this.getGuide(),
            options: [
                {
                    name: 'response',
                    description: 'exact personal response',
                    type: 'STRING',
                    required: true
                }
            ]
        };
    }
    async interactiveExecute({ guildID, member, options, reply }) {
        return reply(await MemberResponses_1.removeMemberResponse(guildID, member.id, options[0].value), { ephemeral: true });
    }
    async execute(message, { commandless1 }, addGuildLog) {
        return message.reply(await MemberResponses_1.removeMemberResponse(message.guild.id, message.member.id, commandless1));
    }
    getAliases() {
        return this._aliases;
    }
    getGuide() {
        return guides_json_1.GshowPerms;
    }
    getKeyword() {
        return keywords_json_1.showPerms;
    }
};
RemovePersonalResponseCmdImpl = __decorate([
    Inversify_1.injectable()
], RemovePersonalResponseCmdImpl);
exports.RemovePersonalResponseCmdImpl = RemovePersonalResponseCmdImpl;
