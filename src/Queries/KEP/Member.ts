import { Snowflake } from "discord.js";
import moment, { Moment } from "moment-timezone";
import { mutedMemberTable } from "../../../values/generic/DB.json";
import { deleteBatch, findAll, findOne, saveBatch } from "../../DB/GenericCRUD";
import { mutedMember } from "../../Entities/KEP/Member";
moment.locale("el");
moment.tz("Europe/Athens");

export function saveMutedMember(member_id: Snowflake, unmuteAt: Moment, provoker_id: Snowflake, roles: Snowflake[], reason?: string) {
    return saveBatch(mutedMemberTable, [{
        member_id,
        unmuteAt,
        provoker_id,
        reason,
        roles
    }])
}

export function dropMutedMember(member_id: Snowflake) {
    return deleteBatch(mutedMemberTable, { member_id })
}

export function fetchMutedMembers() {
    return findAll(mutedMemberTable, true) as Promise<mutedMember[]>
}

export function findMutedMember(member_id: Snowflake) {
    return findOne(mutedMemberTable, { member_id }) as Promise<mutedMember>
}