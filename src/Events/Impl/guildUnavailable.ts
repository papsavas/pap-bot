import { ClientEvents, Guild } from "discord.js";
import { logsChannel } from "../../index";
const { guildID: botGuildID } = (await import('../../../bot.config.json', { assert: { type: 'json' } })).default;

const name: keyof ClientEvents = "guildUnavailable";

const execute = async (guild: Guild) => {
    if (guild.id !== botGuildID)
        logsChannel.send(`@here guild ${guild.name} with id: ${guild.id} is unavailable`)
            .then(() => console.log(`${new Date().toString()} : guild ${guild.name} is unavailable.\n`));
}

export default { name, execute }