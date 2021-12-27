import { ClientEvents, GuildBan } from "discord.js";
import { guildMap } from "../..";


const name: keyof ClientEvents = "guildBanAdd";

const execute = async (ban: GuildBan) => {
    guildMap.get(ban.guild.id)
        ?.onGuildBanAdd(ban)
        .catch(console.error);
}

export default { name, execute }