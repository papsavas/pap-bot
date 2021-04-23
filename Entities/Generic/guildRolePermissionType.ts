import {Snowflake} from "discord.js";

export type guildRolePermissionType = {
    guild_id: Snowflake,
    role_id: Snowflake,
    command_id: string,
    uuid?: string
}