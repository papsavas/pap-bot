import { Snowflake } from "discord.js";

export interface guildLog {
    guild_id: Snowflake,
    member_id?: Snowflake,
    date?: Date,
    log: string

}