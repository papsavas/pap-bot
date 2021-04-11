import * as Discord from 'discord.js';
import {commandType} from "../Entities/CommandType";
import Bundle from "./Bundle";


export default class BundleImpl implements Bundle {
    private client: Discord.Client;
    private guild: Discord.Guild | undefined;
    private message: Discord.Message | undefined;
    private channel: Discord.Channel | undefined;
    private member: Discord.GuildMember | undefined;
    private user: Discord.User | undefined;
    private command: commandType | undefined;
    private logs: Map<Discord.Snowflake, string[]> = new Map();

    constructor() {
    }

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

    getLogs(): string[] {
        return this.logs.get(this.guild.id);
    }

    setClient(client: Discord.Client) {
        this.client = client;
        //create log arrays
        this.client.guilds.cache
            .forEach((guild) => this.logs[guild.id] = []);
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

    addLog(log: string): void {
        const logArr: string[] = this.logs.get(this.guild.id);
        logArr.push(log);
        this.logs.set(this.guild.id, logArr);
    }

    extractId(s:string): Discord.Snowflake {
        if (s.includes('/')) { //extract id from msg link
            const linkContents = s.split('/');
            s = linkContents[linkContents.length - 1];
        }
        return s;
    }


}