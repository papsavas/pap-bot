import { Client, Interaction, Message, MessageReaction, User, GuildMember, Collection, ApplicationCommand } from "discord.js";
import { DMCommandManager } from "../Commands/Managers/Interf/DMCommandManager";
import { GuildCommandManager } from "../Commands/Managers/Interf/GuildCommandManager";
import { guildSettings } from "../Entities/Generic/guildSettingsType";

export default interface GenericDm {
    readonly commandManager: DMCommandManager;

    onReady(client: Client): Promise<any>;

    onSlashCommand(interaction: Interaction): Promise<any>;

    onMessage(message: Message): Promise<any>;

    onMessageDelete(deletedMessage: Message): Promise<any>;

    onMessageReactionAdd(messageReaction: MessageReaction, user: User): Promise<any>;

    onMessageReactionRemove(messageReaction: MessageReaction, user: User): Promise<any>;

    setPrefix(newPrefix: string): void;

    fetchCommands(): Promise<Collection<string, ApplicationCommand>>;
}