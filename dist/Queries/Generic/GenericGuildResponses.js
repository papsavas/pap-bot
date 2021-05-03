"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genericGuildResponses = void 0;
const CoreRepo_1 = require("../../DB/CoreRepo");
async function genericGuildResponses(guildID, nsfwEnabled) {
    const res = await CoreRepo_1.fetchTable('generic_responses');
    const retArr = [];
    res.forEach((resp) => {
        if (nsfwEnabled)
            retArr.push(resp['response']);
        else if (!resp['nsfw'])
            retArr.push(resp['response']);
    });
    return retArr;
}
exports.genericGuildResponses = genericGuildResponses;
