import { BaseCommandInteraction, ButtonInteraction, Client, Message, MessageReaction, SelectMenuInteraction, User } from "discord.js";

export interface DmHandler {
    onReady(client: Client): Promise<unknown>;

    onSlashCommand(interaction: BaseCommandInteraction): Promise<unknown>;

    onButton(interaction: ButtonInteraction): Promise<unknown>

    onSelectMenu(interaction: SelectMenuInteraction): Promise<unknown>

    onMessage(message: Message): Promise<unknown>;

    onMessageDelete(deletedMessage: Message): Promise<unknown>;

    onMessageReactionAdd(messageReaction: MessageReaction, user: User): Promise<unknown>;

    onMessageReactionRemove(messageReaction: MessageReaction, user: User): Promise<unknown>;
}