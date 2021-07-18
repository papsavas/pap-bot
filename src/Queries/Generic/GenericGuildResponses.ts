import { Snowflake } from "discord.js";
import { findAll } from "../../../DB/GenericCRUD";

export async function genericGuildResponses(guildID: Snowflake, nsfwEnabled: boolean): Promise<string[]> {
    const res = await findAll('generic_responses', true, ['*']);
    const retArr = [];
    res.forEach((resp) => {
        if (nsfwEnabled)
            retArr.push(resp['response'])
        else if (!resp['nsfw'])
            retArr.push(resp['response']);
    });
    return retArr;

}