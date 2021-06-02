import { Client, Interaction, Message, MessageReaction, User, GuildMember, Collection, ApplicationCommand } from "discord.js";
import { DMCommandHandler } from "../Commands/DM/DMCommandHandler";
import { GuildCommandHandler } from "../Commands/Guild/GuildCommandHandler";
import { guildSettings } from "../Entities/Generic/guildSettingsType";

export default interface GenericDm {
    readonly commandHandler: DMCommandHandler;

    onReady(client: Client): Promise<any>;

    onSlashCommand(interaction: Interaction): Promise<any>;

    onMessage(message: Message): Promise<any>;

    onMessageDelete(deletedMessage: Message): Promise<any>;

    onMessageReactionAdd(messageReaction: MessageReaction, user: User): Promise<any>;

    onMessageReactionRemove(messageReaction: MessageReaction, user: User): Promise<any>;

    setPrefix(newPrefix: string): void;

    fetchCommands(): Promise<Collection<string, ApplicationCommand>>;
}