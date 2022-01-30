import { ClientEvents, GuildMember, PartialGuildMember } from "discord.js";
import { guildMap } from "../..";


const name: keyof ClientEvents = "guildMemberUpdate";

const execute = async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
    guildMap.get(newMember.guild.id)
        ?.onGuildMemberUpdate(
            oldMember.partial ? await oldMember.fetch() : oldMember as GuildMember,
            newMember)
        .catch(console.error);
}

export default { name, execute }