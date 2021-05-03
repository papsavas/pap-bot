"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMemberResponse = exports.addMemberResponse = exports.fetchAllGuildMemberResponses = exports.fetchGuildMemberResponses = void 0;
const CoreRepo_1 = require("../../DB/CoreRepo");
function fetchGuildMemberResponses(guildID, memberID) {
    return CoreRepo_1.fetchAllOnCondition('guild_responses', {
        'guild_id': guildID,
        'member_id': memberID,
    }, ['response']);
}
exports.fetchGuildMemberResponses = fetchGuildMemberResponses;
async function fetchAllGuildMemberResponses(guildID) {
    try {
        const raw = await CoreRepo_1.fetchAllOnCondition('guild_responses', { "guild_id": guildID }, ['member_id', 'response']);
        const respArr = [];
        raw.forEach(obj => respArr.push(obj.response));
        return Promise.resolve(respArr);
    }
    catch (err) {
        return Promise.reject(err);
    }
}
exports.fetchAllGuildMemberResponses = fetchAllGuildMemberResponses;
function addMemberResponse(guild_id, member_id, response, nsfw) {
    return CoreRepo_1.addRow('guild_responses', {
        "guild_id": guild_id,
        "member_id": member_id,
        "response": response,
        "nsfw": nsfw
    }, ['response']);
}
exports.addMemberResponse = addMemberResponse;
async function removeMemberResponse(guild_id, member_id, response) {
    const res = await CoreRepo_1.dropRows('guild_responses', {
        "guild_id": guild_id,
        "member_id": member_id,
        "response": response,
    });
    let resp;
    res > 0 ? resp = Promise.resolve(`removed ${res} responses`) : resp = Promise.resolve(`Response \`\`\`${response}\`\`\` not found`);
    return resp;
}
exports.removeMemberResponse = removeMemberResponse;
