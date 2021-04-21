import {Snowflake} from "discord.js";
import {fetchFirstOnCondition, updateRow} from "../../DB/dbRepo";
import {guildSettingsType} from "../../Entities/Generic/guildSettingsType";

export function fetchGuildSettings(guildID: Snowflake): Promise<guildSettingsType> {
    return fetchFirstOnCondition('guild_settings', 'guild_id', guildID) as Promise<guildSettingsType>;
}

export function updateGuildSettings(guildID: Snowflake, newData: {}): Promise<any>{
    return updateRow('guild_settings' ,'guild_id', guildID, newData, ['*'])
}