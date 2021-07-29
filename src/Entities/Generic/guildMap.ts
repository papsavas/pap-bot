import { Collection, Snowflake } from "discord.js";
import { GenericGuild } from "../../Handlers/Guilds/GenericGuild";

export type GuildMap = Collection<Snowflake, GenericGuild>;