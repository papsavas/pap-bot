"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCommandPerms = exports.overrideCommandPerms = void 0;
const CoreRepo_1 = require("../../DB/CoreRepo");
async function overrideCommandPerms(guild_id, command_id, roleIDs) {
    await CoreRepo_1.dropRows('command_perms', {
        "guild_id": guild_id,
        "command_id": command_id
    });
    const rows = roleIDs.map(roleID => Object.assign({}, {
        "guild_id": guild_id,
        "command_id": command_id,
        "role_id": roleID
    }));
    return CoreRepo_1.addRows('command_perms', rows, '*');
}
exports.overrideCommandPerms = overrideCommandPerms;
function fetchCommandPerms(guild_id, command_id) {
    return CoreRepo_1.fetchAllOnCondition('command_perms', {
        "guild_id": guild_id,
        "command_id": command_id
    }, ['*']);
}
exports.fetchCommandPerms = fetchCommandPerms;
