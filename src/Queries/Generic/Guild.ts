import { Guild } from "discord.js";
const { prefix: defaultPrefix } = (await import("../../../bot.config.json", { assert: { type: 'json' } })).default;
const { guildSettingsTable, guildTable } = (await import("../../../values/generic/DB.json", { assert: { type: 'json' } })).default;
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

