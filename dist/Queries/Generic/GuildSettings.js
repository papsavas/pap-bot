"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGuildSettings = exports.fetchGuildSettings = void 0;
const CoreRepo_1 = require("../../DB/CoreRepo");
function fetchGuildSettings(guildID) {
    return CoreRepo_1.fetchFirstOnCondition('guild_settings', 'guild_id', guildID);
}
exports.fetchGuildSettings = fetchGuildSettings;
function updateGuildSettings(guildID, newData) {
    return CoreRepo_1.updateRow('guild_settings', 'guild_id', guildID, newData, ['*']);
}
exports.updateGuildSettings = updateGuildSettings;
