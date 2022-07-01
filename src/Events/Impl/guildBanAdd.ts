import { ClientEvents, GuildBan } from "discord.js";
import { guilds } from "../../Inventory/guilds";
const name: keyof ClientEvents = "guildBanAdd";

const execute = async (ban: GuildBan) => {
    guilds.get(ban.guild.id)
        ?.onGuildBanAdd(ban)
        .catch(console.error);
}

export default { name, execute }