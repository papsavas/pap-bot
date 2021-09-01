import { Guild } from "discord.js";
import { prefix as defaultPrefix } from "../../../botconfig.json";
import { guildSettingsTable, guildTable } from "../../../values/generic/DB.json";
import { deleteBatch, saveBatch } from "../../DB/GenericCRUD";

async function saveGuild(guild: Guild): Promise<void> {
    await saveBatch(guildTable, [{ "guild_id": guild.id }]);
    await saveBatch(guildSettingsTable, [{
        "prefix": defaultPrefix,
        "guild_id": guild.id

    }])
}

async function dropGuild(guild: Guild): Promise<number> {
    return deleteBatch(guildTable, { "guild_id": guild.id }); //cascades the rest
}

export { dropGuild, saveGuild };

