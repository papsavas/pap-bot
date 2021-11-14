import { Snowflake } from "discord.js";

export interface MemberResponses {
    member_id: Snowflake,
    responses: string[],
}

