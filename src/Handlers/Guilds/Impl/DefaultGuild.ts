import { Snowflake } from 'discord.js';
import { GuildCommandManagerImpl } from '../../../Commands/Managers/Impl/GuildCommandManagerImpl';
import { AbstractGuild } from "../AbstractGuild";
import { GenericGuild } from "../GenericGuild";

export default class DefaultGuild extends AbstractGuild implements GenericGuild {
    private constructor(id: Snowflake) {
        super(id);
    }

    static async init(guild_id: Snowflake): Promise<GenericGuild> {
        const guild = new DefaultGuild(guild_id);
        guild.commandManager = new GuildCommandManagerImpl(
            guild_id,
            await Promise.all(guild._genericCommands)
        );
        return guild;
    }
}