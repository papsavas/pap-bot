import { ClientEvents, GuildBan } from "discord.js";

const name: keyof ClientEvents = "guildBanAdd";

const execute = async (ban: GuildBan) => {
    const { guilds } = await import('../../Inventory/guilds');
    guilds.get(ban.guild.id)
        ?.onGuildBanAdd(ban)
        .catch(console.error);
}

export default { name, execute }