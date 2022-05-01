import { Snowflake } from "discord.js";
import moment, { Moment } from "moment-timezone";
const { mutedMemberTable } = (await import("../../../values/generic/DB.json", { assert: { type: 'json' } })).default;
import { deleteBatch, findAll, findOne, saveBatch } from "../../DB/GenericCRUD";
import { MutedMember } from "../../Entities/KEP/Member";
moment.locale("el");
moment.tz("Europe/Athens");

function saveMutedMember(member_id: Snowflake, unmuteAt: Moment, provoker_id: Snowflake, roles: Snowflake[], reason?: string) {
    return saveBatch(mutedMemberTable, [{
        member_id,
        unmuteAt,
        provoker_id,
        reason,
        roles
    }])
}

function dropMutedMember(member_id: Snowflake) {
    return deleteBatch(mutedMemberTable, { member_id })
}

function fetchMutedMembers() {
    return findAll(mutedMemberTable, true) as Promise<MutedMember[]>
}

function findMutedMember(member_id: Snowflake) {
    return findOne(mutedMemberTable, { member_id }) as Promise<MutedMember>
}

export { saveMutedMember, dropMutedMember, fetchMutedMembers, findMutedMember };
