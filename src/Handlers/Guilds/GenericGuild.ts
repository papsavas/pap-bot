
import { ApplicationCommand, Collection, Guild, GuildBan, GuildMember, Snowflake, VoiceState } from 'discord.js';
import { GuildCommandManager } from '../../Commands/Managers/Interf/GuildCommandManager';
import { GuildSettings } from "../../Entities/Generic/guildSettings";
import GenericHandler from '../GenericHandler';
export interface GenericGuild extends GenericHandler {
    readonly commandManager: GuildCommandManager;
    readonly guild: Guild;
    onGuildJoin(guild: Guild): Promise<unknown>;
    onGuildLeave(guild: Guild): Promise<unknown>;
    onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<unknown>;
    onGuildMemberAdd(member: GuildMember): Promise<unknown>;
    onGuildMemberRemove(member: GuildMember): Promise<unknown>;
    onGuildMemberUpdate(oldMember: GuildMember, newMember: GuildMember): Promise<unknown>;
    onGuildBanAdd(ban: GuildBan): Promise<unknown>;
    onGuildBanRemove(ban: GuildBan): Promise<unknown>;
    getSettings(): GuildSettings;
    setPrefix(newPrefix: string): void;
    patchVoiceLobbySetting(newVoiceLobby: Snowflake): void;
    fetchCommands(): Promise<Collection<string, ApplicationCommand>>;
    loadResponses(): Promise<void>;
}