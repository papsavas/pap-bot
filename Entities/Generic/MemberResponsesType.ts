import {Snowflake} from "discord.js";
import {fetchAllOnCondition} from "../../DB/dbRepo";

export type memberResponsesType = {
    member_id: Snowflake,
    responses: string[]
}

