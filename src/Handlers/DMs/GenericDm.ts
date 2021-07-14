import { Client, Interaction, Message, MessageReaction, User, GuildMember, Collection, ApplicationCommand, CommandInteraction, ButtonInteraction, SelectMenuInteraction } from "discord.js";
import { DMCommandManager } from "../../Commands/Managers/Interf/DMCommandManager";
import { GuildCommandManager } from "../../Commands/Managers/Interf/GuildCommandManager";
import { guildSettings } from "../../Entities/Generic/guildSettingsType";

export interface DmHandler {
    readonly commandManager: DMCommandManager;

    onReady(client: Client): Promise<unknown>;

    onSlashCommand(interaction: CommandInteraction): Promise<unknown>;

    onButton(interaction: ButtonInteraction): Promise<unknown>

    onSelectMenu(interaction: SelectMenuInteraction): Promise<unknown>

    onMessage(message: Message): Promise<unknown>;

    onMessageDelete(deletedMessage: Message): Promise<unknown>;

    onMessageReactionAdd(messageReaction: MessageReaction, user: User): Promise<unknown>;

    onMessageReactionRemove(messageReaction: MessageReaction, user: User): Promise<unknown>;
}