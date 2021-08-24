import { Snowflake } from "discord.js";
import { Moment } from "moment";
import { drivePermsTable } from "../../../values/generic/DB.json";
import { deleteBatch, findOne, saveBatch } from "../../DB/GenericCRUD";
import { drivePermission } from "../../Entities/KEP/Drive";


export function findDrivePerm(member_id: Snowflake) {
    return findOne(drivePermsTable, { member_id }) as Promise<drivePermission>;
}

export function saveDrivePermission(permId: string, until: Moment, memberId: Snowflake) {
    return saveBatch(drivePermsTable, [
        {
            "perm_id": permId,
            "createdAt": new Date(),
            destroyedAt: until.toDate(),
            "member_id": memberId
        }
    ]);
}

export function dropDrivePermission(permId: string) {
    return deleteBatch(drivePermsTable, { "perm_id": permId });
}