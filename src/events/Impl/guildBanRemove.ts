import { ClientEvents, GuildBan } from "discord.js";
import { guildMap } from "../..";


const name: keyof ClientEvents = "guildBanRemove";

const execute = async (ban: GuildBan) => {
    guildMap.get(ban.guild.id)
        ?.onGuildBanRemove(ban)
        .catch(console.error);
}

export default { name, execute }