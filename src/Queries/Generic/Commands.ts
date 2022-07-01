import { Collection, Snowflake } from "discord.js";
import * as dbLiterals from '../../../values/generic/DB.json';
import { deleteBatch, findAll, findOne, saveBatch, updateAll } from "../../DB/GenericCRUD";
import { CommandOptions } from "../../Entities/Generic/command";
import { CommandPermission } from "../../Entities/Generic/commandPermission";
const { commandPermsTable, commandsTable } = dbLiterals;

/**
 * @deprecated due to Discord Permissions v2
 */
async function overrideCommandPerms(guild_id: Snowflake, command_id: Snowflake, roleIDs: Snowflake[]): Promise<CommandPermission[]> {
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

async function dropGuildCommands(guild_id: Snowflake) {
    return deleteBatch(commandsTable, { guild_id });
}

/**
 * @deprecated due to Discord Permissions v2
 */
async function dropCommandPerms(command_id: Snowflake, guild_id: Snowflake) {
    return deleteBatch(commandPermsTable, { guild_id, command_id });
}

/**
 * @deprecated due to Discord Permissions v2
 */
async function dropAllCommandPerms(guild_id: Snowflake) {
    return deleteBatch(commandPermsTable, { guild_id });
}

/**
 * @deprecated due to Discord Permissions v2
 */
function fetchCommandPerms(guild_id: Snowflake, command_id: Snowflake): Promise<CommandPermission[]> {
    return findAll(commandPermsTable,
        {
            "guild_id": guild_id,
            "command_id": command_id
        },
        ['*']
    ) as Promise<CommandPermission[]>;
}

async function fetchCommandID(keyword: string, guild_id?: Snowflake): Promise<Collection<Snowflake, Snowflake>> {
    const cl = guild_id ? { keyword, guild_id } : { keyword }
    const res = await findAll(commandsTable, cl);
    const coll = new Collection<Snowflake, Snowflake>();
    for (const i of (res as CommandOptions[])) {
        coll.set(i.id, i.guild_id);
    }
    return coll;
}

async function overrideCommands(newCommands: CommandOptions[]): Promise<void> {
    for (const cmd of newCommands) {
        /*incase keyword is unchanged, there is still a connection with previous, update*/
        const prev = await findOne(commandsTable, { "keyword": cmd.keyword, "guild_id": cmd.guild_id ?? null }) as CommandOptions;
        if (Boolean(prev)) {
            await updateAll(commandsTable, { id: prev.id }, cmd);
        }
        else
            await saveBatch(commandsTable, [cmd]);
    }
}

async function fetchGlobalCommandIds(): Promise<Snowflake[]> {
    const ret = await findAll(commandsTable, {
        "global": true
    }, ['id']);
    return ret.map((res: CommandOptions) => res.id) as Snowflake[];
}

export {
    dropAllCommandPerms,
    dropCommandPerms,
    dropGuildCommands,
    fetchCommandID,
    fetchCommandPerms,
    fetchGlobalCommandIds,
    overrideCommandPerms,
    overrideCommands
};

