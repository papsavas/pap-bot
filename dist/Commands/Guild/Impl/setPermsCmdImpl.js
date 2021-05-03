"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetPermsCmdImpl = void 0;
const inversify_1 = require("inversify");
const AbstractCommand_1 = require("../AbstractCommand");
const keywords_json_1 = require("../../keywords.json");
const guides_json_1 = require("../../guides.json");
const guildRolePerms_1 = require("../../../Queries/Generic/guildRolePerms");
let SetPermsCmdImpl = class SetPermsCmdImpl extends AbstractCommand_1.AbstractCommand {
    constructor() {
        super(...arguments);
        this._aliases = this.addKeywordToAliases(['setPerms', 'setperms', 'set_perms'], keywords_json_1.setPerms);
    }
    getCommandData() {
        return {
            name: `lockCommand`,
            description: this.getGuide(),
            options: [
                {
                    name: 'command_name',
                    description: 'command name to override perms',
                    type: 'STRING',
                    required: true
                },
                {
                    name: 'role1',
                    description: 'allowed role',
                    type: 'ROLE',
                    required: true,
                    choices: []
                },
                {
                    name: 'role2',
                    description: 'allowed role',
                    type: 'ROLE',
                    required: false
                },
                {
                    name: 'role3',
                    description: 'allowed role',
                    type: 'ROLE',
                    required: false
                },
            ]
        };
    }
    async interactiveExecute(interaction) {
        const guild_id = interaction.guildID;
        const filteredRoles = interaction.options.filter(option => option.role);
        const rolesKeyArr = filteredRoles.map(filteredOptions => filteredOptions.role.id);
        const command_id = interaction.options[0].value; //cannot retrieve command from aliases, must be exact
        await interaction.defer(true);
        await guildRolePerms_1.overrideCommandPerms(guild_id, command_id, [...new Set(rolesKeyArr)]);
        return interaction.reply(`Command ${command_id} overriden`, { ephemeral: true });
    }
    execute(receivedMessage, receivedCommand, addGuildLog) {
        const guild_id = receivedMessage.guild.id;
        const rolesKeyArr = receivedMessage.mentions.roles.keyArray();
        if (receivedMessage.mentions.everyone)
            rolesKeyArr.push(guild_id);
        const command_id = receivedCommand.arg1; //cannot retrieve command from aliases, must be exact
        return guildRolePerms_1.overrideCommandPerms(guild_id, command_id, [...new Set(rolesKeyArr)]);
    }
    getKeyword() {
        return keywords_json_1.setPerms;
    }
    getAliases() {
        return this._aliases;
    }
    getGuide() {
        return guides_json_1.GsetPerms;
    }
};
SetPermsCmdImpl = __decorate([
    inversify_1.injectable()
], SetPermsCmdImpl);
exports.SetPermsCmdImpl = SetPermsCmdImpl;
