"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractGuild = void 0;
const botconfig_json_1 = require("../botconfig.json");
const inversify_config_1 = require("../Inversify/inversify.config");
const Types_1 = require("../Inversify/Types");
const toolbox_1 = require("../toolbox/toolbox");
const GenericGuildResponses_1 = require("../Queries/Generic/GenericGuildResponses");
const GuildSettings_1 = require("../Queries/Generic/GuildSettings");
const MemberResponses_1 = require("../Queries/Generic/MemberResponses");
const commandHandler = inversify_config_1.default.get(Types_1.TYPES.CommandHandler);
class AbstractGuild {
    constructor(guild_id) {
        this._logs = [];
        this.guildID = guild_id;
    }
    get guild() {
        return this._guild;
    }
    get userResponses() {
        return this._userResponses;
    }
    get logs() {
        return this._logs;
    }
    getSettings() {
        return this._settings;
    }
    onGuildMemberAdd(member) {
        return Promise.resolve(this.addGuildLog(`member ${member.displayName} joined the guild`));
    }
    onGuildMemberRemove(member) {
        return Promise.resolve(this.addGuildLog(`member ${member.displayName} left the guild`));
    }
    onGuildMemberUpdate(oldMember, newMember) {
        return Promise.resolve(`member ${newMember.displayName} updated`);
    }
    onSlashCommand(interaction) {
        return commandHandler.onSlashCommand(interaction);
    }
    async onMessage(message) {
        if ([this._settings.prefix].some((pr) => message.content.startsWith(pr))) {
            return commandHandler.onCommand(message);
        }
        if (message.content.match(botconfig_json_1.mentionRegex)) {
            //implement mentionHandler
            message.channel.startTyping();
            return message.reply(toolbox_1.randArrElement(this._responses))
                .then(msg => message.channel.stopTyping())
                .catch(err => console.log(err));
        }
        return Promise.resolve(`message received`);
    }
    onMessageDelete(deletedMessage) {
        return Promise.resolve(this.addGuildLog(`deleted a message with id:${deletedMessage.id} in ${deletedMessage.channel.isText?.name}`));
    }
    onMessageReactionAdd(messageReaction, user) {
        return Promise.resolve(`reaction added`);
    }
    onMessageReactionRemove(messageReaction, user) {
        return Promise.resolve(`reaction removed`);
    }
    async onReady(client) {
        this._guild = client.guilds.cache.get(this.guildID);
        await this.loadResponses();
        return Promise.resolve(`loaded ${this.guild.name}`);
    }
    addGuildLog(log) {
        this.logs.push(log);
        return log;
    }
    setPrefix(newPrefix) {
        this._settings.prefix = newPrefix;
    }
    async loadResponses() {
        this._settings = await GuildSettings_1.fetchGuildSettings(this.guildID);
        const genericResponses = await GenericGuildResponses_1.genericGuildResponses(this.guildID, this._settings.nsfw_responses);
        const memberConcatResponses = await MemberResponses_1.fetchAllGuildMemberResponses(this.guildID);
        this._responses = memberConcatResponses.concat(genericResponses);
        return Promise.resolve('responses reloaded');
    }
}
exports.AbstractGuild = AbstractGuild;
