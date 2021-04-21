import {Snowflake} from "discord.js";
import {fetchFirstOnCondition} from "../../DB/dbRepo";


export type guildSettingsType = {
    prefix: string;
    guild_id: Snowflake;
    nsfw_responses: boolean;
}

export function fetchGuildSettings(guildID: Snowflake): Promise<guildSettingsType> {
    return fetchFirstOnCondition('guild_settings', 'guild_id', guildID) as Promise<guildSettingsType>;
}