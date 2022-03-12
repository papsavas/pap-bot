import { ChannelType, ClientEvents, Message, PartialMessage } from "discord.js";
import { dmHandler, guilds } from "../..";


const name: keyof ClientEvents = "messageDelete";

const execute = async (deletedMessage: Message<boolean> | PartialMessage) => {
    if (deletedMessage.partial) return; //cannot fetch deleted data

    if (deletedMessage.author.id === deletedMessage.client.user.id || deletedMessage.author.bot)
        return

    switch (deletedMessage.channel.type) {
        case ChannelType.DM:
            dmHandler.onMessageDelete(deletedMessage as Message)
                .catch(console.error);
            break;

        case ChannelType.GuildText:
        case ChannelType.GuildPrivateThread:
        case ChannelType.GuildPublicThread:
        case ChannelType.GuildNews:
        case ChannelType.GuildNewsThread:
            guilds.get(deletedMessage.guild?.id)
                ?.onMessageDelete(deletedMessage as Message)
                .catch(console.error);
            break;
    }
}

export default { name, execute }