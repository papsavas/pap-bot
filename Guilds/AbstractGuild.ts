import {
    Client, CommandInteraction, Guild,
    GuildMember, Message, MessageReaction,
    Snowflake, User
} from 'discord.js';
import { mentionRegex } from "../botconfig.json";
import { GuildCommandHandler } from "../Commands/Guild/GuildCommandHandler";
import GuildCommandHandlerImpl from "../Commands/Guild/GuildCommandHandlerImpl";
import { GenericCommand } from "../Commands/Guild/GenericCommand";
import { AddResponseCmdImpl } from "../Commands/Guild/Impl/addResponseCmdImpl";
import { ClearMessagesCmdImpl } from "../Commands/Guild/Impl/clearMessagesCmdImpl";
import { DmMemberCmdImpl } from "../Commands/Guild/Impl/dmMemberCmdImpl";
import { EditMessageCmdImpl } from "../Commands/Guild/Impl/editMessageCmdImpl";
import { LockCommandCmdImpl } from "../Commands/Guild/Impl/lockCommandCmdImpl";
import { MessageChannelCmdImpl } from "../Commands/Guild/Impl/messageChannelCmdImpl";
import { NsfwSwitchCmdImpl } from "../Commands/Guild/Impl/nsfwSwitchCmdImpl";
import { PinMessageCmdImpl } from "../Commands/Guild/Impl/pinMessageCmdImpl";
import { PollCmdImpl } from "../Commands/Guild/Impl/pollCmdImpl";
import { RemovePersonalResponseCmdImpl } from "../Commands/Guild/Impl/removePersonalResponseCmdImpl";
import { SetPrefixCmdImpl } from "../Commands/Guild/Impl/setPrefixCmdImpl";
import { ShowLogsCmdImpl } from "../Commands/Guild/Impl/showLogsCmdImpl";
import { ShowPermsCmdsImpl } from "../Commands/Guild/Impl/showPermsCmdsImpl";
import { ShowPersonalResponsesCmdImpl } from "../Commands/Guild/Impl/showPersonalResponsesCmdImpl";
import { UnlockCommandCmdImpl } from "../Commands/Guild/Impl/unlockCommandCmdImpl";
import { UnpinMessageCmdImpl } from "../Commands/Guild/Impl/unpinMessageCmdImpl";

import { guildSettings } from "../Entities/Generic/guildSettingsType";
import { memberResponses } from "../Entities/Generic/MemberResponsesType";
import { genericGuildResponses } from "../Queries/Generic/GenericGuildResponses";
import { addLog } from "../Queries/Generic/guildLogs";
import { fetchGuildSettings } from "../Queries/Generic/GuildSettings";
import { fetchAllGuildMemberResponses } from "../Queries/Generic/MemberResponses";
import { randomArrayValue } from "../toolbox/randomArrayValue";
import { GenericGuild } from "./GenericGuild";

export abstract class AbstractGuild implements GenericGuild {
    protected readonly guildID: Snowflake;
    private _commandHandler: GuildCommandHandler;
    get commandHandler(): GuildCommandHandler {
        return this._commandHandler;
    }
    protected _commands: GenericCommand[] = [
        new PollCmdImpl(), new DmMemberCmdImpl(), new SetPrefixCmdImpl(),
        new PinMessageCmdImpl(), new UnpinMessageCmdImpl(),
        new MessageChannelCmdImpl(), new ClearMessagesCmdImpl(), new EditMessageCmdImpl(),
        new LockCommandCmdImpl(), new UnlockCommandCmdImpl(), new ShowPermsCmdsImpl(),
        new AddResponseCmdImpl(), new ShowPersonalResponsesCmdImpl(), new RemovePersonalResponseCmdImpl(),
        new NsfwSwitchCmdImpl(), new ShowLogsCmdImpl()
    ]

    protected constructor(guild_id: Snowflake, specifiedCommands?: GenericCommand[]) {
        this.guildID = guild_id;
        this._commandHandler = new GuildCommandHandlerImpl(
            guild_id,
            this._commands.concat(specifiedCommands ?? []) //merge specified commands if any
        );
    }

    private _responses: string[];
    private _settings: guildSettings;

    private _guild: Guild;

    get guild(): Guild {
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

    onGuildMemberAdd(member: GuildMember): Promise<any> {
        return Promise.resolve(this.addGuildLog(`member ${member.displayName} joined the guild`));

    }

    onGuildMemberRemove(member: GuildMember): Promise<any> {
        return Promise.resolve(this.addGuildLog(`member ${member.displayName} left the guild`));
    }

    onGuildMemberUpdate(oldMember: GuildMember, newMember: GuildMember): Promise<any> {
        return Promise.resolve(`member ${newMember.displayName} updated`);
    }

    onSlashCommand(interaction: CommandInteraction): Promise<any> {
        return this._commandHandler.onSlashCommand(interaction);
    }

    async onMessage(message: Message): Promise<any> {
        if ([this._settings.prefix].some((pr: string) => message.content.startsWith(pr))) {
            return this._commandHandler.onCommand(message);
        }

        if (message.content.match(mentionRegex)) {
            message.channel.startTyping();
            return message.reply(randomArrayValue(this._responses))
                .then(msg => message.channel.stopTyping())
                .catch(err => console.log(err));
        }

        return Promise.resolve(`message received`);
    }

    onMessageDelete(deletedMessage: Message): Promise<any> {
        return Promise.resolve(this.addGuildLog(`deleted a message with id:${deletedMessage.id} in ${deletedMessage.channel.isText?.name}`));
    }

    onMessageReactionAdd(messageReaction: MessageReaction, user: User): Promise<any> {
        return Promise.resolve(`reaction added`);
    }

    onMessageReactionRemove(messageReaction: MessageReaction, user: User): Promise<any> {
        return Promise.resolve(`reaction removed`);
    }

    async onReady(client: Client): Promise<any> {
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

    fetchCommands() {
        //this refreshes every time
        //return this._commandHandler.fetchGuildCommands(this.guild.commands); 
        return this.guild.commands.fetch();
    }

    async loadResponses() {
        this._settings = await fetchGuildSettings(this.guildID);
        const genericResponses = await genericGuildResponses(this.guildID, this._settings.nsfw_responses);
        const memberConcatResponses: string[] = await fetchAllGuildMemberResponses(this.guildID);
        this._responses = memberConcatResponses.concat(genericResponses);
        return Promise.resolve('responses reloaded')
    }

}