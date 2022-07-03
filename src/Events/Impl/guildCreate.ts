import { ClientEvents, Guild } from "discord.js";
import { guilds, PAP } from "../..";
import DefaultGuild from "../../Handlers/Guilds/Impl/DefaultGuild";
import { saveGuild } from "../../Queries/Generic/Guild";

const name: keyof ClientEvents = "guildCreate";
const execute = async (guild: Guild) => {
    console.log(`joined ${guild.name} guild`);
    try {
        await saveGuild(guild) //required before init
        guilds.set(guild.id, await DefaultGuild.init(guild.id));
        const g = guilds.get(guild.id);
        await g.onGuildJoin(guild);
        await g.onReady(PAP);
        console.log(`${guild.name} ready`)
    } catch (err) {
        console.log(err)
    }
}

export default { name, execute }