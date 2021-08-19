import { Collection, Snowflake } from "discord.js";
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
    return saveBatch(commandPermsTable, rows);
}

export async function dropCommandPerms(command_id: Snowflake, guild_id: Snowflake) {
    return deleteBatch(commandPermsTable, { guild_id, command_id });
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


export async function fetchCommandID(keyword: string, guild_id?: Snowflake): Promise<Collection<Snowflake, Snowflake>> {
    const cl = guild_id ? { keyword, guild_id } : { keyword }
    const res = await findAll(commandsTable, cl);
    const coll = new Collection<Snowflake, Snowflake>();
    for (const i of (res as CommandType[])) {
        coll.set(i.id, i.guild_id);
    }
    return coll;
}

export async function overrideCommands(newCommands: CommandType[]): Promise<void> {
    for (const cmd of newCommands) {
        /*incase keyword is unchanged, there is still a connection with previous, update*/
        const prev = await findOne(commandsTable, { "keyword": cmd.keyword, "guild_id": cmd.guild_id ?? null }) as CommandType;
        if (Boolean(prev)) {
            await updateAll(commandsTable, { id: prev.id }, cmd);
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