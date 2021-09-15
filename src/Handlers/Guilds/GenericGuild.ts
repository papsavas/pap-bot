
import { ApplicationCommand, ButtonInteraction, Client, Collection, CommandInteraction, ContextMenuInteraction, Guild, GuildBan, GuildMember, Message, MessageReaction, SelectMenuInteraction, User, VoiceState } from 'discord.js';
import { GuildCommandManager } from '../../Commands/Managers/Interf/GuildCommandManager';
import { guildSettings } from "../../Entities/Generic/guildSettings";
export interface GenericGuild {

    readonly commandManager: GuildCommandManager;

    readonly guild: Guild;

    onReady(client: Client): Promise<unknown>;

    onGuildJoin(guild: Guild): Promise<unknown>;

    onGuildLeave(guild: Guild): Promise<unknown>;

    onSlashCommand(interaction: CommandInteraction | ContextMenuInteraction): Promise<unknown>;

    onButton(interaction: ButtonInteraction): Promise<unknown>;

    onSelectMenu(interaction: SelectMenuInteraction): Promise<unknown>;

    onMessage(message: Message): Promise<unknown>;

    onMessageDelete(deletedMessage: Message): Promise<unknown>;

    onMessageReactionAdd(messageReaction: MessageReaction, user: User): Promise<unknown>;

    onMessageReactionRemove(messageReaction: MessageReaction, user: User): Promise<unknown>;

    onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<unknown>;

    onGuildMemberAdd(member: GuildMember): Promise<unknown>;

    onGuildMemberRemove(member: GuildMember): Promise<unknown>;

    onGuildMemberUpdate(oldMember: GuildMember, newMember: GuildMember): Promise<unknown>;

    onGuildBanAdd(ban: GuildBan): Promise<unknown>;

    onGuildBanRemove(ban: GuildBan): Promise<unknown>;

    addGuildLog(log: string): string;

    getSettings(): guildSettings;

    setPrefix(newPrefix: string): void;

    fetchCommands(): Promise<Collection<string, ApplicationCommand>>;

    loadResponses(): Promise<void>;
}