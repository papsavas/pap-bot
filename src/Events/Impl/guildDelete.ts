import { ClientEvents, Guild } from "discord.js";
import { guilds } from "../..";


const name: keyof ClientEvents = "guildDelete";

const execute = async (guild: Guild) => {
    console.log(`left ${guild.name} guild`);
    const g = guilds.get(guild.id);
    g.onGuildLeave(guild)
        .then(() => guilds.delete(guild.id))
        .catch(console.error);
}

export default { name, execute }