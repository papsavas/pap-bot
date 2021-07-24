import { Snowflake } from "discord.js";
import { deleteBatch, findAll, findOne, saveBatch, update } from "../../DB/GenericCRUD";
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
    const change = await Promise.all(newCommands
        .map(async command => ({
            oldId: await findOne('commands', { "keyword": command.keyword }, ['id'])['id'],
            keyword: command.keyword,
            newID: command.id
        })));
    for (const obj of Object.values(change)) {
        if (!obj.oldId) continue;
        await update(
            'command_perms', { "command_id": obj.oldId },
            Object.assign(
                await findOne('command_perms', { "command_id": obj.oldId })
                , { "command_id": obj.newID })
        );
    }
    for (const cmd of newCommands)
        await deleteBatch('commands', { "id": cmd.id });
    return saveBatch('commands', newCommands, '*');
}

export async function fetchGlobalCommandIds(): Promise<Snowflake[]> {
    const ret = await findAll("commands", {
        "global": true
    }, ['id']);
    return ret.map((res: CommandType) => res.id) as Snowflake[];
}