import {Snowflake} from "discord.js";

export type guildSettingsType = {
    prefix: string;
    guild_id: Snowflake;
    nsfw_responses: boolean;
}
