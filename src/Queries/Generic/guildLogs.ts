import { Snowflake } from "discord.js";
import { addRow, fetchAllOnCondition } from "../../../DB/CoreRepo";
import { guildLog } from "../../Entities/Generic/guildLog";

export async function loadGuildLogs(guild_id: Snowflake): Promise<guildLog[]> {
    return fetchAllOnCondition('guild_logs', {
        "guild_id": guild_id,
    }, ['guild_id', 'member_id', 'log', 'date']) as unknown as guildLog[];
}

export function addLog(guild_id: Snowflake, log: string, member_id?: Snowflake): Promise<guildLog> {
    return addRow('guild_logs', {
        "guild_id": guild_id,
        "log": log,
        "member_id": member_id ?? null,
        "date": new Date()
    })
}