import {addRows, dropRows, fetchAllOnCondition} from "../../DB/dbRepo";
import {Snowflake} from "discord.js";
import {guildRolePermissionType} from "../../Entities/Generic/guildRolePermissionType";


export async function overrideCommandPerms(guild_id: Snowflake, command_id: string, roleIDs: Snowflake[]): Promise<guildRolePermissionType []> {
    await dropRows('command_perms',
        {
            "guild_id": guild_id,
            "command_id": command_id
        })
    const rows = roleIDs.map(roleID => Object.assign({}, {
        "guild_id": guild_id,
        "command_id": command_id,
        "role_id": roleID
    }))
    console.log(`Inside query\nConstructed rows are:\n${JSON.stringify(rows)}`)
    return addRows('command_perms', rows, '*');
}

export function fetchCommandPerms(guild_id: Snowflake, command_id: string): Promise<guildRolePermissionType[]> {
    return fetchAllOnCondition('command_perms',
        {
            "guild_id": guild_id,
            "command_id": command_id
        },
        ['*']
    );
}