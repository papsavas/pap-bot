import * as Discord from 'discord.js';
import {commandType} from "../Entities/CommandType";

export default interface Bundle {
    getClient(): Discord.Client,

    getGuild(): Discord.Guild,

    getMessage(): Discord.Message,

    getChannel(): Discord.Channel,

    getMember(): Discord.GuildMember,

    getUser(): Discord.User,

    getCommand(): commandType

    getLogs(): string [];

    setClient(client: Discord.Client): void,

    setGuild(guild: Discord.Guild): void,

    setMessage(message: Discord.Message): void,

    setChannel(channel: Discord.Channel): void,

    setMember(member: Discord.GuildMember): void,

    setUser(user: Discord.User): void,

    setCommand(command: commandType): void,

    addLog(log: string): void,

    extractId(s :string): Discord.Snowflake
}