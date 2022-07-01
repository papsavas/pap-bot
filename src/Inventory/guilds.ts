import { Collection, Snowflake } from "discord.js";
import { PAP } from "..";
import * as kepIds from "../../values/KEP/IDs.json" assert { type: 'json' };
import * as woapIds from "../../values/WOAP/IDs.json" assert { type: 'json' };
import { Guilds } from "../Entities/Generic/Guilds";
import { GenericGuild } from "../Handlers/Guilds/GenericGuild";
import DefaultGuild from "../Handlers/Guilds/Impl/DefaultGuild";
import { KepGuild } from "../Handlers/Guilds/Impl/KepGuild";
import { WoapGuild } from "../Handlers/Guilds/Impl/WoapGuild";
const { guildId: kepGuildId } = kepIds;
const { guildId: woapGuildId } = woapIds;
const guilds: Guilds = new Collection<Snowflake, GenericGuild>();
// Initializing the guilds
guilds.set(kepGuildId, await KepGuild.init(kepGuildId));
guilds.set(woapGuildId, await WoapGuild.init(woapGuildId));
for (const guildID of PAP.guilds.cache.keys()) {
    if (!guilds.has(guildID))
        guilds.set(guildID, await DefaultGuild.init(guildID));
    const g = guilds.get(guildID);
    await g.onReady(PAP); //load guilds
};

export { guilds };

