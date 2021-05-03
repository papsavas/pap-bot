"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockMessageCmdImpl = void 0;
const keywords_json_1 = require("../../keywords.json");
const guides_json_1 = require("../../guides.json");
const Inversify_1 = require("Inversify");
const AbstractCommand_1 = require("../AbstractCommand");
const upperLowerCaseSwitching_1 = require("../../../toolbox/upperLowerCaseSwitching");
let MockMessageCmdImpl = class MockMessageCmdImpl extends AbstractCommand_1.AbstractCommand {
    constructor() {
        super(...arguments);
        this._aliases = this.addKeywordToAliases(['mock'], keywords_json_1.mock);
    }
    getCommandData() {
        return {
            name: keywords_json_1.mock,
            description: this.getGuide(),
            options: [
                {
                    name: 'text',
                    description: 'text to mock',
                    type: 'STRING',
                    required: true
                }
            ]
        };
    }
    async interactiveExecute(interaction) {
        return interaction.reply(upperLowerCaseSwitching_1.default(interaction.options[0].value));
    }
    execute(message, { commandless1 }, addGuildLog) {
        return message.channel.send(upperLowerCaseSwitching_1.default(commandless1))
            .then(mockedMessage => {
            if (message.deletable)
                message.delete().catch();
        });
    }
    getAliases() {
        return this._aliases;
    }
    getGuide() {
        return guides_json_1.Gmock;
    }
    getKeyword() {
        return keywords_json_1.mock;
    }
};
MockMessageCmdImpl = __decorate([
    Inversify_1.injectable()
], MockMessageCmdImpl);
exports.MockMessageCmdImpl = MockMessageCmdImpl;
