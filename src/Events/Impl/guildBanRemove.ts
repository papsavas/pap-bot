import { ClientEvents, GuildBan } from "discord.js";
import { guilds } from "../../Inventory/guilds";

const name: keyof ClientEvents = "guildBanRemove";

const execute = async (ban: GuildBan) => {
    guilds.get(ban.guild.id)
        ?.onGuildBanRemove(ban)
        .catch(console.error);
}

export default { name, execute }