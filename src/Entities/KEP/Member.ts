import { Snowflake } from "discord.js";

export interface MutedMember {
    member_id: Snowflake;
    provoker_id: Snowflake;
    roles: Snowflake[];
    unmuteAt: Date;
    reason?: string;
    uuid?: string

}