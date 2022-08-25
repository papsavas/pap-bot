import { ChannelType, ClientEvents, Message } from "discord.js";
import { creatorID } from '../../../bot.config.json' assert { type: 'json' };
import { dmHandler } from "../../Inventory/DMs";
import { guilds } from "../../Inventory/guilds";

const name: keyof ClientEvents = 'messageCreate';
const execute = async (message: Message) => {
    if (message.author.id === creatorID && message.content.startsWith('eval'))
        try {
            const Discord = await import('discord.js');
            return eval(message.cleanContent
                .substring('eval'.length + 1)
                .replace(/(\r\n|\n|\r)/gm, "") //remove all line breaks
                .replace("```", "") //remove code blocks
                .replace("`", "") //remove code quotes
            );

        }
        catch (err) {
            console.error(err);
            message.reply({ content: err.toString(), allowedMentions: { parse: [] } })
                .catch(internalErr => console.log(internalErr));
        }

    if (message.author.id === (await import('../../index')).PAP.user.id)
        return

    switch (message.channel.type) {
        case ChannelType.DM:
            dmHandler.onMessage(message)
                .catch(console.error);
            break;

        case ChannelType.GuildText:
        case ChannelType.GuildPrivateThread:
        case ChannelType.GuildPublicThread:
        case ChannelType.GuildNews:
        case ChannelType.GuildNewsThread: {
            guilds.get(message.guildId)
                ?.onMessage(message)
                .catch(console.error);
            break;
        }
    }
}

export default { name, execute };