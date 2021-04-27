import {Snowflake} from "discord.js";

export interface guildRolePermission {
    guild_id: Snowflake,
    role_id: Snowflake,
    command_id: string,
    uuid?: string
}