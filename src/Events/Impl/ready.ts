import { ClientEvents, GuildChannelManager, TextChannel } from "discord.js";
import { PAP } from "../..";
import * as config from "../../../bot.config.json";
import * as guildIds from "../../../values/PAP/IDs.json";
import channels from "../../Inventory/Channels";

const name: keyof ClientEvents = "ready";

const execute = async () => {
    try {
        PAP.user.setActivity('over you', { type: 'WATCHING' });
        const PAPGuildChannels: GuildChannelManager = (await PAP.guilds.cache.get(config.guildID).fetch()).channels;
        channels.initLogs = PAPGuildChannels.cache.get(guildIds.channels.init_logs) as TextChannel;
        channels.bugsChannel = PAPGuildChannels.cache.get(guildIds.channels.bugs) as TextChannel;
        channels.logsChannel = PAPGuildChannels.cache.get(guildIds.channels.logs) as TextChannel;
        console.log('smooth init');

    } catch (err) {
        console.log('READY ERROR');
        console.log(err);
    }
    console.log(`___ Initiated ___`);
}
export default { name, execute }