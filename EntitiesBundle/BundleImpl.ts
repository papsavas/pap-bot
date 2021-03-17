import * as Discord from 'discord.js';
import { commandType } from '../Entities/CommandType';
import Bundle  from './Bundle';


export default class BundleImpl implements Bundle {
    constructor() { }

    private client: Discord.Client;
    private guild: Discord.Guild | undefined;
    private message: Discord.Message | undefined;
    private channel: Discord.Channel | undefined;
    private member: Discord.GuildMember | undefined;
    private user: Discord.User | undefined;
    private command: commandType | undefined;


    getClient(): Discord.Client {
        return this.client;
    }

    getGuild(): Discord.Guild {
        return this.guild;
    }

    getMessage(): Discord.Message {
        return this.message;
    }

    getChannel(): Discord.Channel {
        return this.channel;
    }

    getMember(): Discord.GuildMember {
        return this.member;
    }

    getUser(): Discord.User {
        return this.user;
    }

    getCommand(): commandType {
        return this.command;
    }

    setClient(client: Discord.Client) {
        this.client = client;
    }

    setGuild(guild: Discord.Guild) {
        this.guild = guild
    }

    setMessage(message: Discord.Message) {
        this.message = message;
        this.guild = message.guild;
        this.channel = message.channel;
        this.member = message.member;
        this.user = message.author;
    }

    setChannel(channel: Discord.Channel) {
        this.channel = channel;
    }

    setMember(member: Discord.GuildMember) {
        this.member = member;
    }

    setUser(user: Discord.User) {
        this.user = user;
    }

    setCommand(candidateCommand: commandType) {
        this.command = candidateCommand;
    }

}