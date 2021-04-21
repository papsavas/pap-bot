import {GenericGuild} from "./GenericGuild";
import * as Discord from 'discord.js';
import {Guild, Snowflake} from 'discord.js';
import {bundle, PAP} from "../index";
import {mentionRegex, prefix, qprefix} from "../botconfig.json";
import container from "../Inversify/inversify.config";
import {CommandHandler} from "../Commands/CommandHandler";
import {TYPES} from "../Inversify/Types";
import {readData} from "../DB/firestoreRepo";
import {randArrElement} from "../toolbox";
import {ResponsesType} from "../Entities/Generic/ResponsesType";

const commandHandler = container.get<CommandHandler>(TYPES.CommandHandler);

export abstract class AbstractGuild implements GenericGuild {

    protected readonly guildID: Snowflake;
    private _guild: Guild;
    private _userResponses: ResponsesType;
    private _responses: string[]; //= this.returnResponses();

    protected constructor(guild_id: Discord.Snowflake) {
        this.guildID = guild_id;
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



    get userResponses(): ResponsesType {
        return this._userResponses;
    }

    get guild(): Discord.Guild {
        return this._guild;
    }

    set guild(value: Discord.Guild) {
        this._guild = value;
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
        const genericResponses = await readData('ChatUtils/genericResponses'); //replace with DB fetch
        this._lightResponses = genericResponses['light'];
        this._heavyResponses = genericResponses['heavy'];
        this._userResponses = await readData(`responses/${this.guildID}`) as ResponsesType
        this._responses = Object.values(this._userResponses).flat(1)
            .concat(this._lightResponses);
        return Promise.resolve(`loaded ${this.guild.name}`);
    }

    addGuildLog(log: string): string {
        this._logs.push(log);
        return log
    }

}