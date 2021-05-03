"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpCmdImpl = void 0;
const AbstractCommand_1 = require("../AbstractCommand");
const keywords_json_1 = require("../../keywords.json");
const guides_json_1 = require("../../guides.json");
const Inversify_1 = require("Inversify");
require("reflect-metadata");
let HelpCmdImpl = class HelpCmdImpl extends AbstractCommand_1.AbstractCommand {
    constructor() {
        super(...arguments);
        this._aliases = this.addKeywordToAliases(['help', 'halp', 'h'], keywords_json_1.help);
    }
    getCommandData() {
        return {
            name: keywords_json_1.help,
            description: this.getGuide(),
        };
    }
    interactiveExecute(interaction) {
        return interaction.reply('help is here');
    }
    execute(message, command, addGuildLog) {
        return (message.channel).send('help is here');
    }
    getKeyword() {
        return keywords_json_1.help;
    }
    getAliases() {
        return this._aliases;
    }
    getGuide() {
        return guides_json_1.Ghelp;
    }
};
HelpCmdImpl = __decorate([
    Inversify_1.injectable()
], HelpCmdImpl);
exports.HelpCmdImpl = HelpCmdImpl;
