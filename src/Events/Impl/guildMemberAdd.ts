import { ClientEvents, GuildMember } from "discord.js";

const name: keyof ClientEvents = "guildMemberAdd";

const execute = async (member: GuildMember) => {
    const { guilds } = await import('../../Inventory/guilds');
    guilds.get(member.guild.id)
        ?.onGuildMemberAdd(member)
        .catch(console.error);
}

export default { name, execute }