import { Guild } from "discord.js";
import { prefix as defaultPrefix } from "../../../botconfig.json";
import { guildLogsTable, guildResponsesTable, guildSettingsTable, guildTable } from "../../../values/generic/DB.json";
import { deleteBatch, saveBatch } from "../../DB/GenericCRUD";

export async function saveGuild(guild: Guild): Promise<void> {
    await saveBatch(guildTable, [{ "guild_id": guild.id }]);
    await saveBatch(guildSettingsTable, [{
        "prefix": defaultPrefix,
        "guild_id": guild.id

    }])
}

export async function dropGuild(guild: Guild): Promise<number> {
    await deleteBatch(guildLogsTable, [{ "guild_id": guild.id }]);
    await deleteBatch(guildResponsesTable, [{ "guild_id": guild.id }]);
    await deleteBatch(guildSettingsTable, [{ "guild_id": guild.id }]);
    return deleteBatch(guildTable, [{ "guild_id": guild.id }]);
}