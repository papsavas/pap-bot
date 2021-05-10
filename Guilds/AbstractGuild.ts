import { GenericGuild } from "./GenericGuild";
import * as Discord from 'discord.js';
import { Guild, Snowflake } from 'discord.js';
import { mentionRegex } from "../botconfig.json";
import { randomArrayValue } from "../toolbox/randomArrayValue";
import { genericGuildResponses } from "../Queries/Generic/GenericGuildResponses";
import { guildSettings } from "../Entities/Generic/guildSettingsType";
import { fetchGuildSettings } from "../Queries/Generic/GuildSettings";
import { memberResponses } from "../Entities/Generic/MemberResponsesType";
import { fetchAllGuildMemberResponses } from "../Queries/Generic/MemberResponses";
import CommandHandlerImpl from "../Commands/Guild/CommandHandlerImpl";
import { addLog } from "../Queries/Generic/guildLogs";

const commandHandler = new CommandHandlerImpl()

export abstract class AbstractGuild implements GenericGuild {
    protected readonly guildID: Snowflake;
    private _responses: string[];
    private _settings: guildSettings;

    protected constructor(guild_id: Discord.Snowflake) {
        this.guildID = guild_id;
    }

    private _guild: Guild;

    get guild(): Discord.Guild {
        return this._guild;
    }

    private _userResponses: memberResponses;

    get userResponses(): memberResponses {
        return this._userResponses;
    }

    private _logs: string[] = [];

    get logs(): string[] {
        return this._logs;
    }

    getSettings(): guildSettings {
        return this._settings;
    }

    onGuildMemberAdd(member: Discord.GuildMember): Promise<any> {
        return Promise.resolve(this.addGuildLog(`member ${member.displayName} joined the guild`));

    }

    onGuildMemberRemove(member: Discord.GuildMember): Promise<any> {
        return Promise.resolve(this.addGuildLog(`member ${member.displayName} left the guild`));
    }

    onGuildMemberUpdate(oldMember: Discord.GuildMember, newMember: Discord.GuildMember): Promise<any> {
        return Promise.resolve(`member ${newMember.displayName} updated`);
    }

    onSlashCommand(interaction: Discord.CommandInteraction): Promise<any> {
        return commandHandler.onSlashCommand(interaction);
    }

    async onMessage(message: Discord.Message): Promise<any> {
        if ([this._settings.prefix].some((pr: string) => message.content.startsWith(pr))) {
            return commandHandler.onCommand(message);
        }

        if (message.content.match(mentionRegex)) {
            //implement mentionHandler
            message.channel.startTyping();
            return message.reply(randomArrayValue(this._responses))
                .then(msg => message.channel.stopTyping())
                .catch(err => console.log(err));
        }

        return Promise.resolve(`message received`);
    }

    onMessageDelete(deletedMessage: Discord.Message): Promise<any> {
        return Promise.resolve(this.addGuildLog(`deleted a message with id:${deletedMessage.id} in ${deletedMessage.channel.isText?.name}`));
    }

    onMessageReactionAdd(messageReaction: Discord.MessageReaction, user: Discord.User): Promise<any> {
        return Promise.resolve(`reaction added`);
    }

    onMessageReactionRemove(messageReaction: Discord.MessageReaction, user: Discord.User): Promise<any> {
        return Promise.resolve(`reaction removed`);
    }

    async onReady(client: Discord.Client): Promise<any> {
        this._guild = client.guilds.cache.get(this.guildID);
        await this.loadResponses()
        return Promise.resolve(`loaded ${this.guild.name}`);
    }

    addGuildLog(log: string, member_id: Snowflake = null): string {
        this.logs.push(log);
        addLog(this.guildID, log, member_id)
            .catch(er => console.error(er));
        return log;
    }

    setPrefix(newPrefix: string): void {
        this._settings.prefix = newPrefix;
    }

    async loadResponses() {
        this._settings = await fetchGuildSettings(this.guildID);
        const genericResponses = await genericGuildResponses(this.guildID, this._settings.nsfw_responses);
        const memberConcatResponses: string[] = await fetchAllGuildMemberResponses(this.guildID);
        this._responses = memberConcatResponses.concat(genericResponses);
        return Promise.resolve('responses reloaded')
    }

}