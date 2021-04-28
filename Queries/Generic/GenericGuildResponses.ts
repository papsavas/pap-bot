import {Snowflake} from "discord.js";
import {fetchTable} from "../../DB/CoreRepo";

export async function genericGuildResponses(guildID: Snowflake, nsfwEnabled: boolean): Promise<string[]> {
    const res = await fetchTable('generic_responses');
    const retArr = [];
    res.forEach((resp)=> {
        if (nsfwEnabled)
            retArr.push(resp['response'])
        else if (!resp['nsfw'])
            retArr.push(resp['response']);
    });
    return retArr;

}