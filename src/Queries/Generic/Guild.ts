import { Guild } from "discord.js";
import { prefix as defaultPrefix } from "../../../botconfig.json";
import { commandPermsTable, guildSettingsTable, guildTable } from "../../../values/generic/DB.json";
import { deleteBatch, saveBatch } from "../../DB/GenericCRUD";
import { GuildMap } from "../../Entities/Generic/guildMap";

export async function saveGuild(guildMap: GuildMap, guild: Guild): Promise<void> {
    await saveBatch(guildTable, [{ "guild_id": guild.id }]);
    await saveBatch(
        commandPermsTable,
        guildMap.get(guild.id).commandManager.commands.map(cmd =>
        ({
            "guild_id": guild.id,
            "role_id": guild.id,
            "command_id": cmd.id
        }))

    );
    await saveBatch(guildSettingsTable, [{
        "prefix": defaultPrefix,
        "guild_id": guild.id

    }])
}

export function deleteGuild(guild: Guild): Promise<number> {
    //cascade applies to all tables
    return deleteBatch(guildTable, [{ "guild_id": guild.id }]);
}