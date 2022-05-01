import { Collection, Snowflake } from "discord.js";
import { Guilds } from "../Entities/Generic/Guilds";
import { GenericGuild } from "../Handlers/Guilds/GenericGuild";

const { guildId: kepGuildId } = (await import("../../values/KEP/IDs.json", { assert: { type: 'json' } })).default;
const { guildId: woapGuildId } = (await import("../../values/WOAP/IDs.json", { assert: { type: 'json' } })).default;
import { KepGuild } from "../Handlers/Guilds/Impl/KepGuild";
import { PAP } from "..";
import { WoapGuild } from "../Handlers/Guilds/Impl/WoapGuild";
import { DefaultGuild } from "../Handlers/Guilds/Impl/DefaultGuild";

export const guilds: Guilds = new Collection<Snowflake, GenericGuild>();
// Initializing the guilds
guilds.set(kepGuildId, await KepGuild.init(kepGuildId));
guilds.set(woapGuildId, await WoapGuild.init(woapGuildId));
for (const guildID of PAP.guilds.cache.keys()) {
    if (!guilds.has(guildID))
        guilds.set(guildID, await DefaultGuild.init(guildID));
    const g = guilds.get(guildID);
    await g.onReady(PAP); //load guilds
};