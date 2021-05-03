"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowPermsCmdsImpl = void 0;
const discord_js_1 = require("discord.js");
const keywords_json_1 = require("../../keywords.json");
const guides_json_1 = require("../../guides.json");
const Inversify_1 = require("Inversify");
const AbstractCommand_1 = require("../AbstractCommand");
const guildRolePerms_1 = require("../../../Queries/Generic/guildRolePerms");
const index_1 = require("../../../index");
let ShowPermsCmdsImpl = class ShowPermsCmdsImpl extends AbstractCommand_1.AbstractCommand {
    constructor() {
        super(...arguments);
        this._aliases = this.addKeywordToAliases(['perms', 'perm', 'showperms', 'show_perms'], keywords_json_1.showPerms);
    }
    getCommandData() {
        return {
            name: keywords_json_1.showPerms,
            description: this.getGuide(),
            options: [
                {
                    name: 'command',
                    description: 'permissions for command',
                    type: 'STRING',
                    required: true
                }
            ]
        };
    }
    async interactiveExecute(interaction) {
        const command_id = interaction.options[0].value;
        const guild_prefix = index_1.guildMap.get(interaction.guildID).getSettings().prefix;
        await interaction.defer(true);
        const commandPerms = await guildRolePerms_1.fetchCommandPerms(interaction.guildID, command_id);
        const reqRoles = await Promise.all(commandPerms.map(cp => interaction.guild.roles.fetch(cp.role_id)));
        return interaction.editReply(new discord_js_1.MessageEmbed({
            title: guild_prefix + command_id,
            description: `Enabled for : ${reqRoles.toString()}`,
        }));
    }
    async execute(message, { arg1 }, addGuildLog) {
        const command_id = arg1;
        const guild_prefix = index_1.guildMap.get(message.guild.id).getSettings().prefix;
        const commandPerms = await guildRolePerms_1.fetchCommandPerms(message.guild.id, command_id);
        return Promise.all(commandPerms.map(cp => message.guild.roles.fetch(cp.role_id)))
            .then(reqRoles => message.reply(new discord_js_1.MessageEmbed({
            title: guild_prefix + command_id,
            description: `Enabled for : ${reqRoles.toString()}`,
        })));
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
ShowPermsCmdsImpl = __decorate([
    Inversify_1.injectable()
], ShowPermsCmdsImpl);
exports.ShowPermsCmdsImpl = ShowPermsCmdsImpl;
