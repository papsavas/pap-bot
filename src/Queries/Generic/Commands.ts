import { Snowflake } from "discord.js";
import { deleteBatch, findAll, findOne, saveBatch } from "../../../DB/GenericCRUD";
import { CommandType } from "../../Entities/Generic/command";
import { commandPermission } from "../../Entities/Generic/commandPermission";

export async function overrideCommandPerms(guild_id: Snowflake, command_id: Snowflake, roleIDs: Snowflake[]): Promise<commandPermission[]> {
    await deleteBatch('command_perms',
        {
            "guild_id": guild_id,
            "command_id": command_id
        })
    const rows = roleIDs.map(roleID => ({
        "guild_id": guild_id,
        "command_id": command_id,
        "role_id": roleID
    }));
    return saveBatch('command_perms', rows, '*');
}

export function fetchCommandPerms(guild_id: Snowflake, command_id: Snowflake): Promise<commandPermission[]> {
    return findAll('command_perms',
        {
            "guild_id": guild_id,
            "command_id": command_id
        },
        ['*']
    ) as Promise<commandPermission[]>;
}

export async function fetchCommandID(commandName: string): Promise<Snowflake> {
    const res = await findOne('commands', { "keyword": commandName }, ['id']);
    return res ? res['id'] : null;
}

export async function overrideCommands(newCommands: CommandType[]): Promise<CommandType[]> {
    await deleteBatch('commands', true);
    return saveBatch('commands', newCommands, '*');
}

export async function fetchGlobalCommandIds(): Promise<Snowflake[]> {
    const ret = await findAll("commands", {
        "global": true
    }, ['id']);
    return ret.map((res: CommandType) => res.id) as Snowflake[];
}