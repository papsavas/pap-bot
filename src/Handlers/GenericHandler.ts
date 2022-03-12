import { ButtonInteraction, Client, CommandInteraction, Message, MessageReaction, SelectMenuInteraction, User } from "discord.js";

export default interface GenericHandler {
    onReady(client: Client): Promise<unknown>;
    onCommand(interaction: CommandInteraction): Promise<unknown>;
    onButton(interaction: ButtonInteraction): Promise<unknown>
    onSelectMenu(interaction: SelectMenuInteraction): Promise<unknown>
    onMessage(message: Message): Promise<unknown>;
    onMessageDelete(deletedMessage: Message): Promise<unknown>;
    onMessageReactionAdd(messageReaction: MessageReaction, user: User): Promise<unknown>;
    onMessageReactionRemove(messageReaction: MessageReaction, user: User): Promise<unknown>;
}