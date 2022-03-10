import { ClientEvents, GuildBan } from "discord.js";
import { guilds } from "../..";


const name: keyof ClientEvents = "guildBanAdd";

const execute = async (ban: GuildBan) => {
    guilds.get(ban.guild.id)
        ?.onGuildBanAdd(ban)
        .catch(console.error);
}

export default { name, execute }