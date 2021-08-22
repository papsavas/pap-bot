import { Guild } from "discord.js";
import { prefix as defaultPrefix } from "../../../botconfig.json";
import { guildSettingsTable, guildTable } from "../../../values/generic/DB.json";
import { deleteBatch, saveBatch } from "../../DB/GenericCRUD";
import { GuildMap } from "../../Entities/Generic/guildMap";

export async function registerGuild(guildMap: GuildMap, guild: Guild): Promise<void> {
    await saveBatch(guildTable, [{ "guild_id": guild.id }]);
    //TODO: save guild commands
    await saveBatch(guildSettingsTable, [{
        "prefix": defaultPrefix,
        "guild_id": guild.id

    }])
}

export function unregisterGuild(guild: Guild): Promise<number> {
    //cascade applies to all tables
    return deleteBatch(guildTable, [{ "guild_id": guild.id }]);
}