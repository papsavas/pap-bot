import { Guild } from "discord.js";
import * as config from "../../../bot.config.json" assert { type: "json" };
import * as DB from "../../../values/generic/DB.json" assert { type: "json" };
import { deleteBatch, saveBatch } from "../../DB/GenericCRUD";

async function saveGuild(guild: Guild): Promise<void> {
    await saveBatch(DB.guildTable, [{ "guild_id": guild.id }]);
    await saveBatch(DB.guildSettingsTable, [{
        "prefix": config.prefix,
        "guild_id": guild.id
    }])
}

async function dropGuild(guild: Guild): Promise<number> {
    return deleteBatch(DB.guildTable, { "guild_id": guild.id }); //cascades the rest
}

export { dropGuild, saveGuild };

