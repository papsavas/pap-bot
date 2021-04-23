import {Snowflake} from "discord.js";
import {fetchAllOnCondition} from "../../DB/dbRepo";

export async function fetchGuildMemberResponses(guildID: Snowflake): Promise<string[]> {
    try {
        const raw = await fetchAllOnCondition(
            'guild_responses',
            {"guild_id" : guildID},
            ['member_id', 'response']) as { member_id: Snowflake, response: string }[];
        const respArr: string [] = [];
        raw.forEach(obj => respArr.push(obj.response))
        return Promise.resolve(respArr);
    } catch (err) {
        return Promise.reject(err);
    }
}