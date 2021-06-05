import { addRows, dropRows, fetchAllOnCondition, fetchFirstOnCondition } from "../../DB/CoreRepo";
import { Snowflake } from "discord.js";
import { guildRolePermission } from "../../Entities/Generic/guildRolePermissionType";
import { CommandType } from "../../Entities/Generic/commandType";

export async function overrideCommandPerms(guild_id: Snowflake, command_id: Snowflake, roleIDs: Snowflake[]): Promise<guildRolePermission[]> {
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

export function fetchCommandPerms(guild_id: Snowflake, command_id: Snowflake): Promise<guildRolePermission[]> {
    return fetchAllOnCondition('command_perms',
        {
            "guild_id": guild_id,
            "command_id": command_id
        },
        ['*']
    );
}

export async function fetchCommandID(commandName: string): Promise<Snowflake> {
    const res = await fetchFirstOnCondition('commands', { "keyword": commandName }, ['id']) as CommandType;
    return res.id;


}

export async function overrideCommands(newCommands: CommandType[]): Promise<CommandType[]> {
    await dropRows('commands', true);
    return addRows('commands', newCommands, '*');
}