import { Snowflake } from "discord.js";
import { findAll, saveBatch } from "../../DB/GenericCRUD";
import { guildLog } from "../../Entities/Generic/guildLog";


async function loadGuildLogs(guild_id: Snowflake): Promise<guildLog[]> {
    return findAll('guild_logs', {
        "guild_id": guild_id,
    }, ['guild_id', 'member_id', 'log', 'date']) as Promise<guildLog[]>;
}

async function addLog(guild_id: Snowflake, log: string, member_id?: Snowflake): Promise<guildLog> {
    return await saveBatch('guild_logs',
        [
            {
                "guild_id": guild_id,
                "log": log,
                "member_id": member_id ?? null,
                "date": new Date()
            }
        ],
        '*')[0];
}

export { loadGuildLogs, addLog };
