import {GenericGuild} from "./GenericGuild";
import * as Discord from 'discord.js';
import {Guild, Snowflake} from 'discord.js';
import {bundle} from "../index";
import {mentionRegex, prefix, qprefix} from "../botconfig.json";
import container from "../Inversify/inversify.config";
import {CommandHandler} from "../Commands/CommandHandler";
import {TYPES} from "../Inversify/Types";
import {readData} from "../DB/firestoreRepo";
import {randArrElement} from "../toolbox";
import {fetchGuildMemberResponses, memberResponsesType} from "../Entities/Generic/MemberResponsesType";
import {fetchGuildSettings, guildSettingsType} from "../Entities/Generic/guildSettingsType";
import {fetchGenericGuildResponses} from "../Queries/Generic/fetchGenericGuildResponses";

const commandHandler = container.get<CommandHandler>(TYPES.CommandHandler);

export abstract class AbstractGuild implements GenericGuild {

    protected readonly guildID: Snowflake;
    private _responses: string[]; //= this.returnResponses();
    private _settings: guildSettingsType;

    protected constructor(guild_id: Discord.Snowflake) {
        this.guildID = guild_id;
    }

    private _guild: Guild;

    get guild(): Discord.Guild {
        return this._guild;
    }

    set guild(value: Discord.Guild) {
        this._guild = value;
    }

    private _userResponses: memberResponsesType;

    get userResponses(): memberResponsesType {
        return this._userResponses;
    }

    private _logs: string[] = [];

    get logs(): string[] {
        return this._logs;
    }

    private _lightResponses: string[];

    get lightResponses(): string[] {
        return this._lightResponses;
    }

    private _heavyResponses: string[];

    get heavyResponses(): string[] {
        return this._heavyResponses;
    }

    abstract returnResponses(): string[];

    onGuildMemberAdd(member: Discord.GuildMember): Promise<any> {
        return Promise.resolve(this.addGuildLog(`member ${member.displayName} joined the guild`));

    }

    onGuildMemberRemove(member: Discord.GuildMember): Promise<any> {
        return Promise.resolve(this.addGuildLog(`member ${member.displayName} left the guild`));
    }

    onGuildMemberUpdate(oldMember: Discord.GuildMember, newMember: Discord.GuildMember): Promise<any> {
        return Promise.resolve(`member ${newMember.displayName} updated`);
    }

    onMessage(message: Discord.Message): Promise<any> {
        bundle.setMessage(message);
        if ([prefix, qprefix].some((pr: string) => message.content.startsWith(pr))) {
            return commandHandler.onCommand(message);
        }

        if (message.content.match(mentionRegex)) {
            //implement mentionHandler
            console.log(`mentioned in ${this._guild.name}`)
            return message.reply(randArrElement(this._responses))
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
        this._settings = await fetchGuildSettings(this.guildID);
        const genericResponses = await fetchGenericGuildResponses(this.guildID, this._settings.nsfw_responses);
        const memberConcatResponses: string[] = await fetchGuildMemberResponses(this.guildID);
        this._responses = memberConcatResponses.concat(genericResponses);
        return Promise.resolve(`loaded ${this.guild.name}`);
    }

    addGuildLog(log: string): string {
        this._logs.push(log);
        return log
    }

}