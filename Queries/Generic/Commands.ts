import { addRows, dropRows, fetchAllOnCondition, fetchFirstOnCondition } from "../../DB/CoreRepo";
import { Snowflake } from "discord.js";
import { guildRolePermission } from "../../Entities/Generic/guildRolePermissionType";
import { CommandType } from "../../Entities/Generic/commandType";
import { rest } from "lodash";


export async function overrideCommandPerms(guild_id: Snowflake, command_id: string, roleIDs: Snowflake[]): Promise<guildRolePermission[]> {
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

export function fetchCommandID(commandName: string): Snowflake {
    let id: Snowflake;
    fetchFirstOnCondition('commands', { "keyword": commandName }, ['id'])
        .then((res: CommandType) => id = res.id);
    return id;
}