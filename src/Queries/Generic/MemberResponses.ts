import { Snowflake } from "discord.js";
import { addRow, dropRows, fetchAllOnCondition } from "../../../DB/CoreRepo";

export function fetchGuildMemberResponses(guildID: Snowflake, memberID: Snowflake): Promise<string[]> {
    return fetchAllOnCondition('guild_responses',
        {
            'guild_id': guildID,
            'member_id': memberID,
        }, ['response'])
}

export async function fetchAllGuildMemberResponses(guildID: Snowflake): Promise<string[]> {
    try {
        const raw = await fetchAllOnCondition(
            'guild_responses',
            { "guild_id": guildID },
            ['member_id', 'response']) as { member_id: Snowflake, response: string }[];
        const respArr: string[] = [];
        raw.forEach(obj => respArr.push(obj.response))
        return Promise.resolve(respArr);
    } catch (err) {
        return Promise.reject(err);
    }
}

export function addMemberResponse(guild_id: Snowflake, member_id: Snowflake, response: string, nsfw: boolean) {
    return addRow('guild_responses',
        {
            "guild_id": guild_id,
            "member_id": member_id,
            "response": response,
            "nsfw": nsfw
        },
        ['response'])
}

export async function removeMemberResponse(guild_id: Snowflake, member_id: Snowflake, response: string): Promise<string> {
    const res = await dropRows('guild_responses', {
        "guild_id": guild_id,
        "member_id": member_id,
        "response": response,
    });
    let resp: Promise<string>;
    res > 0 ? resp = Promise.resolve(`removed ${res} responses`) : resp = Promise.resolve(`Response \`\`\`${response}\`\`\` not found`);
    return resp;
}