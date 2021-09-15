import { Snowflake } from "discord.js";

export interface guildSettings {
    prefix: string;
    guild_id: Snowflake;
    voice_lobby: Snowflake;
    nsfw_responses: boolean;
}
