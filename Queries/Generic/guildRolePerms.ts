import {addRow, dropRows, updateRowOnMultConditions} from "../../DB/dbRepo";
import {Snowflake} from "discord.js";


export async function overrideCommandPerms(guild_id: Snowflake, command_id: string, roleIDs: Snowflake[]) {
    await dropRows('command_perms',
        {
        "guild_id": guild_id,
            "command_id": command_id
        })
    return roleIDs.forEach(roleID => addRow('command_perms', {
        "guild_id" : guild_id,
        "command_id": command_id,
        "role_id": roleID

    }))
}