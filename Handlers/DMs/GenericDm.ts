import { Client, Interaction, Message, MessageReaction, User, GuildMember, Collection, ApplicationCommand } from "discord.js";
import { DMCommandManager } from "../../Commands/Managers/Interf/DMCommandManager";
import { GuildCommandManager } from "../../Commands/Managers/Interf/GuildCommandManager";
import { guildSettings } from "../../Entities/Generic/guildSettingsType";

export interface DmHandler {
    readonly commandManager: DMCommandManager;

    onReady(client: Client): Promise<unknown>;

    onSlashCommand(interaction: Interaction): Promise<unknown>;

    onMessage(message: Message): Promise<unknown>;

    onMessageDelete(deletedMessage: Message): Promise<unknown>;

    onMessageReactionAdd(messageReaction: MessageReaction, user: User): Promise<unknown>;

    onMessageReactionRemove(messageReaction: MessageReaction, user: User): Promise<unknown>;
}