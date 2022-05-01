import { Snowflake } from "discord.js";
import moment, { Moment } from "moment-timezone";
import 'moment/locale/el';
const { drivePermsTable } = (await import("../../../values/generic/DB.json", { assert: { type: 'json' } })).default;
import { deleteBatch, findAll, findOne, saveBatch } from "../../DB/GenericCRUD";
import { DrivePermission } from "../../Entities/KEP/Drive";
moment.locale('el');
moment.tz("Europe/Athens");



function findDrivePerm(member_id: Snowflake) {
    return findOne(drivePermsTable, { member_id }) as Promise<DrivePermission>;
}

function saveDrivePermission(permId: string, until: Moment, memberId: Snowflake) {
    return saveBatch(drivePermsTable, [
        {
            "perm_id": permId,
            "createdAt": moment(),
            "destroyedAt": until,
            "member_id": memberId
        }
    ]);
}

function dropDrivePermission(permId: string) {
    return deleteBatch(drivePermsTable, { "perm_id": permId });
}

function fetchDrivePermissions(member_id?: Snowflake) {
    return findAll(drivePermsTable, member_id ? { member_id } : true) as Promise<DrivePermission[]>;
}

export { findDrivePerm, saveDrivePermission, dropDrivePermission, fetchDrivePermissions };
