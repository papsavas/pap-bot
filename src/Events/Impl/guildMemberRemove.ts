import { ClientEvents, GuildMember, PartialGuildMember } from "discord.js";
import { guildMap } from "../..";


const name: keyof ClientEvents = "guildMemberRemove";

const execute = async (member: GuildMember | PartialGuildMember) => {
    const m = member.partial ? await member.fetch() : member;
    guildMap.get(m.guild.id)
        .onGuildMemberRemove(m as GuildMember)
        .catch(console.error);
}

export default { name, execute }