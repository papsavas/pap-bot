import { Collection, Snowflake } from "discord.js";
import { GenericGuild } from "../../Handlers/Guilds/GenericGuild";

export type Guilds = Collection<Snowflake, GenericGuild>;