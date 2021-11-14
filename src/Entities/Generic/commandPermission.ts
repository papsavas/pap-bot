import { Snowflake } from "discord.js";

export interface CommandPermission {
    guild_id: Snowflake,
    role_id: Snowflake,
    command_id: Snowflake,
    uuid?: string
}