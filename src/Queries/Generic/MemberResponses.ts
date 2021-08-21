import { Snowflake } from "discord.js";
import { deleteBatch, findAll, saveBatch } from "../../DB/GenericCRUD";


export async function fetchGuildMemberResponses(guildID: Snowflake, memberID: Snowflake): Promise<string[]> {
    return (await findAll('guild_responses',
        {
            'guild_id': guildID,
            'member_id': memberID,
        }, ['response']))
        .map(res => res['response']);
}

export async function fetchAllGuildMemberResponses(guildID: Snowflake): Promise<string[]> {
    try {
        const raw = await findAll(
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
    return saveBatch(
        'guild_responses',
        [
            {
                "guild_id": guild_id,
                "member_id": member_id,
                "response": response,
                "nsfw": nsfw
            }],
        'response'
    )
}

export async function removeMemberResponse(guild_id: Snowflake, member_id: Snowflake, index: number): Promise<string> {
    if (index < 1 || index > 20) return "Index out of range";
    const resps = await findAll('guild_responses',
        {
            guild_id,
            member_id
        }, ['uuid'])
    const res = await deleteBatch('guild_responses', {
        "uuid": resps[index - 1]['uuid']
    });
    return res > 0 ? `removed ${res} responses` : `Response \`\`\`${index}\`\`\` not found`;
}

export async function memberResponsesCount(member_id: Snowflake, guild_id: Snowflake): Promise<number> {
    const res = await findAll('guild_responses', {
        "guild_id": guild_id,
        "member_id": member_id,
    })
    return res.length;
}