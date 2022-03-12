import { ChannelType, ClientEvents, Message } from "discord.js";
import { dmHandler, guilds, PAP } from "../..";
import { creatorID } from '../../../bot.config.json';

const name: keyof ClientEvents = 'messageCreate';
const execute = async (message: Message) => {
    if (message.author.id === creatorID && message.content.startsWith('eval'))
        try {
            const Discord = require('discord.js');
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

    if (message.author.id === PAP.user.id)
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
            guilds.get(message.guild.id)
                ?.onMessage(message)
                .catch(console.error);
            break;
        }
    }
}

export default { name, execute };