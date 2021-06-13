import * as Discord from 'discord.js';
import { Snowflake } from 'discord.js';
import GuildCommandHandlerImpl from '../../Commands/Guild/GuildCommandHandlerImpl';
import { AbstractGuild } from "../AbstractGuild";
import { GenericGuild } from "../GenericGuild";

export class WoapGuild extends AbstractGuild implements GenericGuild {
    private constructor(id: Snowflake) {
        super(id);
    }

    static async init(guild_id: Snowflake): Promise<GenericGuild> {
        const guild = new WoapGuild(guild_id);
        guild._commands = await Promise.all(guild._commandPromises);
        guild.specifiedCommands = undefined //await Promise.all([commandPromises.init()]);
        guild.commandHandler = new GuildCommandHandlerImpl(
            guild_id,
            guild._commands.concat(guild.specifiedCommands ?? []) //merge specified commands if any
        );
        return guild;
    }
}