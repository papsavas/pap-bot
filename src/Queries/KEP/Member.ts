import { Snowflake } from "discord.js";
import moment, { Moment } from "moment-timezone";
import * as dbLiterals from '../../../values/generic/DB.json' assert { type: 'json' };
import { deleteBatch, findAll, findOne, saveBatch } from "../../DB/GenericCRUD";
import { MutedMember } from "../../Entities/KEP/Member";
const { mutedMemberTable } = dbLiterals;
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

