import {GenericGuild} from "./GenericGuild";
import * as Discord from 'discord.js';

export abstract class AbstractGuild implements GenericGuild {

    protected readonly guildID: Discord.Snowflake;

    constructor(guild_id: Discord.Snowflake) {
        this.guildID = guild_id;
    }

    private _guild: Discord.Guild;

    get guild(): Discord.Guild {
        return this._guild;
    }

    set guild(value: Discord.Guild) {
        this._guild = value;
    }

    onGuildMemberAdd(member: Discord.GuildMember): Promise<any> {
        return Promise.resolve(undefined);
    }

    onGuildMemberRemove(member: Discord.GuildMember): Promise<any> {
        return Promise.resolve(undefined);
    }

    onGuildMemberUpdate(oldMember: Discord.GuildMember, newMember: Discord.GuildMember): Promise<any> {
        return Promise.resolve(undefined);
    }

    onMessage(message: Discord.Message): Promise<any> {
        return Promise.resolve(undefined);
    }

    onMessageDelete(deletedMessage: Discord.Message): Promise<any> {
        return Promise.resolve(undefined);
    }

    onMessageReactionAdd(messageReaction: Discord.MessageReaction, user: Discord.User): Promise<any> {
        return Promise.resolve(undefined);
    }

    onMessageReactionRemove(messageReaction: Discord.MessageReaction, user: Discord.User): Promise<any> {
        return Promise.resolve(undefined);
    }

    onReady(client: Discord.Client): Promise<any> {
        this._guild = client.guilds.cache.get(this.guildID);
        return Promise.resolve(undefined);
    }

}