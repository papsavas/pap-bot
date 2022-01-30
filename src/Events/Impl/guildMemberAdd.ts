import { ClientEvents, GuildMember } from "discord.js";
import { guildMap } from "../..";


const name: keyof ClientEvents = "guildMemberAdd";

const execute = async (member: GuildMember) => {
    guildMap.get(member.guild.id)
        ?.onGuildMemberAdd(member)
        .catch(console.error);
}

export default { name, execute }