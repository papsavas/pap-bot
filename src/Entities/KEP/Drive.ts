import { Snowflake } from "discord.js";

export interface drivePermission {
    perm_id: string;
    member_id: Snowflake;
    createdAt: Date;
    destroyedAt: Date;
    uuid?: string
}