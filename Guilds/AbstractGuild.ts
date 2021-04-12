import {GenericGuild} from "./GenericGuild";
import * as Discord from 'discord.js';
import {bundle, PAP} from "../index";
import {mentionRegex, prefix, qprefix} from "../botconfig.json";
import container from "../Inversify/inversify.config";
import {CommandHandler} from "../Commands/CommandHandler";
import {TYPES} from "../Inversify/Types";
import {randomInt} from "crypto";

const commandHandler = container.get<CommandHandler>(TYPES.CommandHandler);

export abstract class AbstractGuild implements GenericGuild {


    protected readonly guildID: Discord.Snowflake;
    protected logs: string[] = [];

    protected constructor(guild_id: Discord.Snowflake) {
        this.guildID = guild_id;
        this._guild = PAP.guilds.cache.get(guild_id);
    }

    private _responses: string[]

    set responses(value: string[]) {
        this._responses = value;
    }

    private _guild: Discord.Guild;

    get guild(): Discord.Guild {
        return this._guild;
    }


    onGuildMemberAdd(member: Discord.GuildMember): Promise<any> {
        return Promise.resolve(this.addLog(`member ${member.displayName} joined the guild`));

    }

    onGuildMemberRemove(member: Discord.GuildMember): Promise<any> {
        return Promise.resolve(this.addLog(`member ${member.displayName} left the guild`));
    }

    onGuildMemberUpdate(oldMember: Discord.GuildMember, newMember: Discord.GuildMember): Promise<any> {
        return Promise.resolve(`member ${newMember.displayName} updated`);
    }

    onMessage(message: Discord.Message): Promise<any> {
        bundle.setMessage(message);
        if ([prefix, qprefix].some((pr: string) => message.content.startsWith(pr))) {
            return commandHandler.onCommand();
        }

        if (message.content.match(mentionRegex)) {
            //implement mentionHandler
            console.log(`mentioned in ${this._guild.name}`)
            return message.reply(this._responses[randomInt(0, this._responses.length)])
                .catch(err => console.log(err));
        }

        return Promise.resolve(`message received`);
    }

    onMessageDelete(deletedMessage: Discord.Message): Promise<any> {
        return Promise.resolve(this.addLog(`deleted a message with id:${deletedMessage.id} in ${deletedMessage.channel.isText?.name}`));
    }

    onMessageReactionAdd(messageReaction: Discord.MessageReaction, user: Discord.User): Promise<any> {
        return Promise.resolve(`reaction added`);
    }

    onMessageReactionRemove(messageReaction: Discord.MessageReaction, user: Discord.User): Promise<any> {
        return Promise.resolve(`reaction removed`);
    }

    onReady(client: Discord.Client): Promise<any> {
        this._guild = client.guilds.cache.get(this.guildID);
        return Promise.resolve(`loaded ${this.guild.name}`);
    }

    addLog(log: string) :string{
        this.logs.push(log);
        return log
    }

}