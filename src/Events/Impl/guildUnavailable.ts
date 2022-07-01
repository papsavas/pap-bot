import { ClientEvents, Guild } from "discord.js";
import * as config from "../../../bot.config.json" assert { type: 'json' };
import channels from "../../Inventory/channels";

const { guildID: botGuildID } = config;

const name: keyof ClientEvents = "guildUnavailable";

const execute = async (guild: Guild) => {
    if (guild.id !== botGuildID)
        channels.logsChannel.send(`@here guild ${guild.name} with id: ${guild.id} is unavailable`)
            .then(() => console.log(`${new Date().toString()} : guild ${guild.name} is unavailable.\n`));
}

export default { name, execute }