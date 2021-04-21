import {Snowflake} from "discord.js";
import {fetchTable} from "../../DB/dbRepo";

export async function fetchGenericGuildResponses(guildID: Snowflake, nsfwEnabled: boolean): Promise<string[]> {

    const res = await fetchTable('guild_responses') as unknown as { response: string, nsfw: boolean }[];
    const retArr = [];
    res.forEach(resp => {
        if (nsfwEnabled)
            retArr.push(resp.response)
        else if (!resp.nsfw)
            retArr.push(resp.response);
    });
    return retArr;

}