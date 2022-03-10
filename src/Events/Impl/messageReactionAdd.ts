import { ClientEvents, MessageReaction, PartialMessageReaction, PartialUser, User } from "discord.js";
import { dmHandler, guilds } from "../..";


const name: keyof ClientEvents = "messageReactionAdd";

const execute = async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
    if (user.bot) return
    const r = reaction.partial ? await reaction.fetch() : reaction;
    const u = user.partial ? await user.fetch() : user;
    switch (reaction.message.channel.type) {
        case 'DM':
            dmHandler.onMessageReactionAdd(r as MessageReaction, u as User)
                .catch(console.error);
            break;

        case 'GUILD_TEXT':
        case 'GUILD_PRIVATE_THREAD':
        case 'GUILD_PUBLIC_THREAD':
        case 'GUILD_NEWS':
        case 'GUILD_NEWS_THREAD':
            guilds.get(reaction.message.guild?.id)
                ?.onMessageReactionAdd(
                    r as MessageReaction,
                    u as User,
                ).catch(console.error);
            break;
    }
}

export default { name, execute }