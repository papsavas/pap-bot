import * as Discord from 'discord.js';

export interface GenericGuild {
    onReady(client: Discord.Client): Promise<any>;

    onMessage(message: Discord.Message): Promise<any>;

    onMessageDelete(deletedMessage: Discord.Message): Promise<any>;

    onMessageReactionAdd(messageReaction: Discord.MessageReaction, user: Discord.User): Promise<any>;

    onMessageReactionRemove(messageReaction: Discord.MessageReaction, user: Discord.User): Promise<any>;

    onGuildMemberAdd(member: Discord.GuildMember): Promise<any>;

    onGuildMemberRemove(member: Discord.GuildMember): Promise<any>;

    onGuildMemberUpdate(oldMember: Discord.GuildMember, newMember: Discord.GuildMember): Promise<any>;
}