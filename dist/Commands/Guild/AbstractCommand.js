"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractCommand = void 0;
const Inversify_1 = require("Inversify");
require("reflect-metadata");
const Discord = require("discord.js");
const index_1 = require("../../index");
let AbstractCommand = class AbstractCommand {
    matchAliases(possibleCommand) {
        return !!this.getAliases()
            .find((alias) => alias === possibleCommand.toLowerCase());
    }
    logErrorOnBugsChannel(err, guild, primaryCommandLiteral) {
        const emb = new Discord.MessageEmbed({
            author: {
                name: guild.name,
                icon_url: "https://icon-library.com/images/error-icon-transparent/error-icon-transparent-13.jpg"
            },
            thumbnail: {
                proxy_url: guild.iconURL({ format: "png", size: 512 })
            },
            title: primaryCommandLiteral,
            color: "DARK_RED",
            timestamp: new Date()
        });
        emb.setDescription(`\`\`\`${err}\`\`\``);
        index_1.bugsChannel.send(emb).catch(internalErr => console.log(internalErr));
    }
    addKeywordToAliases(aliases, keyword) {
        return aliases.includes(keyword)
            ? [...aliases, keyword]
            : aliases;
    }
};
AbstractCommand = __decorate([
    Inversify_1.injectable()
], AbstractCommand);
exports.AbstractCommand = AbstractCommand;
