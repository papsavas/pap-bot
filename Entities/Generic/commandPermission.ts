import { Snowflake } from "discord.js";

export interface commandPermission {
    guild_id: Snowflake,
    role_id: Snowflake,
    command_id: Snowflake,
    uuid?: string
}