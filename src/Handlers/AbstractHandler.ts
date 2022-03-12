import { ButtonInteraction, CacheType, Client, CommandInteraction, Message, MessageReaction, SelectMenuInteraction, User } from "discord.js";
import GenericHandler from "./GenericHandler";

export default abstract class AbstractHandler implements GenericHandler {
    #entity: string = null;
    protected constructor(entity: string) {
        this.#entity = entity;
    }

    onReady(client: Client): Promise<unknown> {
        return Promise.resolve(`Handler for ${this.#entity} Ready`);
    }
    abstract onCommand(interaction: CommandInteraction<CacheType>): Promise<unknown>;
    abstract onButton(interaction: ButtonInteraction<CacheType>): Promise<unknown>;
    abstract onSelectMenu(interaction: SelectMenuInteraction<CacheType>): Promise<unknown>;
    abstract onMessage(message: Message<boolean>): Promise<unknown>;
    abstract onMessageDelete(deletedMessage: Message<boolean>): Promise<unknown>;
    abstract onMessageReactionAdd(messageReaction: MessageReaction, user: User): Promise<unknown>;
    abstract onMessageReactionRemove(messageReaction: MessageReaction, user: User): Promise<unknown>;
}