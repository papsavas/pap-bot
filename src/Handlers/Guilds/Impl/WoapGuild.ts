import { Snowflake } from 'discord.js';
import { GuildCommandManagerImpl } from '../../../Commands/Managers/Impl/GuildCommandManagerImpl';
import { AbstractGuild } from "../AbstractGuild";
import { GenericGuild } from "../GenericGuild";

const specifiedCommands = undefined;
export class WoapGuild extends AbstractGuild implements GenericGuild {
    private constructor(id: Snowflake) {
        super(id);
    }

    static async init(guild_id: Snowflake): Promise<WoapGuild> {
        const guild = new WoapGuild(guild_id);
        guild.specifiedCommands = specifiedCommands;
        guild.commandManager = new GuildCommandManagerImpl(
            guild_id,
            await Promise.all(
                guild._genericCommands
                    .concat(guild.specifiedCommands ?? [])) //merge specified commands if any

        );
        return guild;
    }
}