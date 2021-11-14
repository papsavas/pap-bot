import { Snowflake } from "discord.js";

export interface GuildSettings {
    prefix: string;
    guild_id: Snowflake;
    voice_lobby: Snowflake;
    nsfw_responses: boolean;
}
