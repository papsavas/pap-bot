import * as Discord from 'discord.js';
import { GuildCommandManager } from '../Commands/Managers/Interf/GuildCommandManager';
import { GuildCommandManagerImpl } from '../Commands/Managers/Impl/GuildCommandManagerImpl';
import { guildSettings } from "../Entities/Generic/guildSettingsType";

export interface GenericGuild {

    readonly commandManager: GuildCommandManager;

    onReady(client: Discord.Client): Promise<string | void>;

    onSlashCommand(interaction: Discord.CommandInteraction): Promise<unknown>;

    onButton(interaction: Discord.ButtonInteraction): Promise<unknown>;

    onMessage(message: Discord.Message): Promise<unknown>;

    onMessageDelete(deletedMessage: Discord.Message): Promise<unknown>;

    onMessageReactionAdd(messageReaction: Discord.MessageReaction, user: Discord.User): Promise<unknown>;

    onMessageReactionRemove(messageReaction: Discord.MessageReaction, user: Discord.User): Promise<unknown>;

    onGuildMemberAdd(member: Discord.GuildMember): Promise<unknown>;

    onGuildMemberRemove(member: Discord.GuildMember): Promise<unknown>;

    onGuildMemberUpdate(oldMember: Discord.GuildMember, newMember: Discord.GuildMember): Promise<unknown>;

    addGuildLog(log: string): string;

    getSettings(): guildSettings;

    setPrefix(newPrefix: string): void;

    fetchCommands(): Promise<Discord.Collection<string, Discord.ApplicationCommand>>;

    loadResponses(): Promise<void>;
}