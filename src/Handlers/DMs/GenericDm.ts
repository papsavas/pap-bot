import { ButtonInteraction, Client, CommandInteraction, Message, MessageReaction, SelectMenuInteraction, User } from "discord.js";
import { DMCommandManager } from "../../Commands/Managers/Interf/DMCommandManager";

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