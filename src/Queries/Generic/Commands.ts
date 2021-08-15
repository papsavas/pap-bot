import { Snowflake } from "discord.js";
import { commandPermsTable, commandsTable } from "../../../values/generic/DB.json";
import { deleteBatch, findAll, findOne, saveBatch, updateAll } from "../../DB/GenericCRUD";
import { CommandType } from "../../Entities/Generic/command";
import { commandPermission } from "../../Entities/Generic/commandPermission";

export async function overrideCommandPerms(guild_id: Snowflake, command_id: Snowflake, roleIDs: Snowflake[]): Promise<commandPermission[]> {
    await deleteBatch(commandPermsTable,
        {
            "guild_id": guild_id,
            "command_id": command_id
        })
    const rows = roleIDs.map(roleID => ({
        "guild_id": guild_id,
        "command_id": command_id,
        "role_id": roleID
    }));
    return saveBatch(commandPermsTable, rows, '*');
}

export async function dropAllCommandPerms(guild_id: Snowflake) {
    return deleteBatch(commandPermsTable, { guild_id });
}


export function fetchCommandPerms(guild_id: Snowflake, command_id: Snowflake): Promise<commandPermission[]> {
    return findAll(commandPermsTable,
        {
            "guild_id": guild_id,
            "command_id": command_id
        },
        ['*']
    ) as Promise<commandPermission[]>;
}

export async function fetchCommandID(commandName: string): Promise<Snowflake> {
    const res = await findOne(commandsTable, { "keyword": commandName }, ['id']);
    return res ? res['id'] : null;
}

export async function overrideCommands(newCommands: CommandType[]): Promise<void> {
    for (const cmd of newCommands) {
        /*incase keyword is unchanged, there is still a connection with previous, update*/
        const prev = await findOne(commandsTable, { "keyword": cmd.keyword }) as CommandType;
        if (prev) {
            await updateAll(commandsTable, { id: prev.id }, Object.assign(prev, cmd));
        }
        else
            await saveBatch(commandsTable, [cmd]);
    }
}

export async function fetchGlobalCommandIds(): Promise<Snowflake[]> {
    const ret = await findAll(commandsTable, {
        "global": true
    }, ['id']);
    return ret.map((res: CommandType) => res.id) as Snowflake[];
}