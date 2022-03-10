import { ClientEvents, GuildMember } from "discord.js";
import { guilds } from "../..";


const name: keyof ClientEvents = "guildMemberAdd";

const execute = async (member: GuildMember) => {
    guilds.get(member.guild.id)
        ?.onGuildMemberAdd(member)
        .catch(console.error);
}

export default { name, execute }