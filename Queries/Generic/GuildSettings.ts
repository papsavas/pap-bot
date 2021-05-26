import { Snowflake } from "discord.js";
import { guildMap } from "../..";
import { fetchFirstOnCondition, updateRow } from "../../DB/CoreRepo";
import { guildSettings } from "../../Entities/Generic/guildSettingsType";

export function fetchGuildSettings(guildID: Snowflake): Promise<guildSettings> {
    return fetchFirstOnCondition('guild_settings', { 'guild_id': guildID }) as Promise<guildSettings>;
}

export function updateGuildSettings(guildID: Snowflake, newData: {}): Promise<any> {
    return updateRow('guild_settings', { 'guild_id': guildID }, newData, ['*'])
}