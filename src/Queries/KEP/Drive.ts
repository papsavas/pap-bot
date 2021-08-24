import { Snowflake } from "discord.js";
import moment, { Moment } from "moment-timezone";
import 'moment/locale/el';
import { drivePermsTable } from "../../../values/generic/DB.json";
import { deleteBatch, findAll, findOne, saveBatch } from "../../DB/GenericCRUD";
import { drivePermission } from "../../Entities/KEP/Drive";
moment.locale('el');
moment.tz("Europe/Athens");



export function findDrivePerm(member_id: Snowflake) {
    return findOne(drivePermsTable, { member_id }) as Promise<drivePermission>;
}

export function saveDrivePermission(permId: string, until: Moment, memberId: Snowflake) {
    return saveBatch(drivePermsTable, [
        {
            "perm_id": permId,
            "createdAt": moment(),
            "destroyedAt": until,
            "member_id": memberId
        }
    ]);
}

export function dropDrivePermission(permId: string) {
    return deleteBatch(drivePermsTable, { "perm_id": permId });
}

export function fetchDrivePermissions(member_id?: Snowflake) {
    return findAll(drivePermsTable, member_id ? { member_id } : true) as Promise<drivePermission[]>;
}