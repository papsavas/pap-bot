import { Snowflake } from "discord.js";
import { findOne, updateAll } from "../../DB/GenericCRUD";
import { guildSettings } from "../../Entities/Generic/guildSettings";

export async function fetchGuildSettings(guildID: Snowflake): Promise<guildSettings> {
    type fields = keyof guildSettings;
    const returnings: fields[] = ["guild_id", "nsfw_responses", "prefix"];
    return findOne('guild_settings', { 'guild_id': guildID }, returnings) as Promise<guildSettings>;
}

export function updateGuildSettings(guildID: Snowflake, newData: {}) {
    return updateAll('guild_settings', { 'guild_id': guildID }, newData, ['*'])
}