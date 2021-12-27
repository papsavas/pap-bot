import { ClientEvents, Message, PartialMessage } from "discord.js";
import { dmHandler, guildMap } from "../..";


const name: keyof ClientEvents = "messageDelete";

const execute = async (deletedMessage: Message<boolean> | PartialMessage) => {
    if (deletedMessage.partial) return; //cannot fetch deleted data

    if (deletedMessage.author.id === deletedMessage.client.user.id || deletedMessage.author.bot)
        return

    switch (deletedMessage.channel.type) {
        case 'DM':
            dmHandler.onMessageDelete(deletedMessage as Message)
                .catch(console.error);
            break;

        case 'GUILD_TEXT':
        case 'GUILD_PRIVATE_THREAD':
        case 'GUILD_PUBLIC_THREAD':
        case 'GUILD_NEWS':
        case 'GUILD_NEWS_THREAD':
            guildMap.get(deletedMessage.guild?.id)
                ?.onMessageDelete(deletedMessage as Message)
                .catch(console.error);
            break;
    }
}

export default { name, execute }