import { Snowflake } from "discord.js";
const { guilds } = await import('../../Inventory/guilds');
import { findOne, updateAll } from "../../DB/GenericCRUD";
import { GuildSettings } from "../../Entities/Generic/guildSettings";

async function fetchGuildSettings(guildID: Snowflake): Promise<GuildSettings> {
    return findOne('guild_settings', { 'guild_id': guildID }) as Promise<GuildSettings>;
}

function updateGuildSettings(guildID: Snowflake, newData: {}) {
    return updateAll('guild_settings', { 'guild_id': guildID }, newData, ['*'])
}

function setVoiceLobby(guild_id: Snowflake, channel_id: Snowflake) {
    const guild = guilds.get(guild_id);
    guild.patchVoiceLobbySetting(channel_id);
    return updateAll('guild_settings', { 'guild_id': guild_id }, { 'voice_lobby': channel_id }, ['*']);
}

export { fetchGuildSettings, updateGuildSettings, setVoiceLobby };

