import {addRows, dropRows, fetchAllOnCondition} from "../../DB/AbstractRepository";
import {Snowflake} from "discord.js";
import {guildRolePermission} from "../../Entities/Generic/guildRolePermissionType";


export async function overrideCommandPerms(guild_id: Snowflake, command_id: string, roleIDs: Snowflake[]): Promise<guildRolePermission []> {
    await dropRows('command_perms',
        {
            "guild_id": guild_id,
            "command_id": command_id
        })
    const rows = roleIDs.map(roleID => Object.assign({}, {
        "guild_id": guild_id,
        "command_id": command_id,
        "role_id": roleID
    }));
    return addRows('command_perms', rows, '*');
}

export function fetchCommandPerms(guild_id: Snowflake, command_id: string): Promise<guildRolePermission[]> {
    return fetchAllOnCondition('command_perms',
        {
            "guild_id": guild_id,
            "command_id": command_id
        },
        ['*']
    );
}