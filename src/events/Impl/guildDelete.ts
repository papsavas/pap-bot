import { ClientEvents, Guild } from "discord.js";
import { guildMap } from "../..";


const name: keyof ClientEvents = "guildDelete";

const execute = async (guild: Guild) => {
    console.log(`left ${guild.name} guild`);
    const g = guildMap.get(guild.id);
    g.onGuildLeave(guild)
        .then(() => guildMap.delete(guild.id))
        .catch(console.error);
}

export default { name, execute }