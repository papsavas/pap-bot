import { ClientEvents, GuildBan } from "discord.js";
import { guilds } from "../..";


const name: keyof ClientEvents = "guildBanRemove";

const execute = async (ban: GuildBan) => {
    guilds.get(ban.guild.id)
        ?.onGuildBanRemove(ban)
        .catch(console.error);
}

export default { name, execute }