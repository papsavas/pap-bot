import { BaseCommandInteraction, ButtonInteraction, Client, Message, MessageReaction, SelectMenuInteraction, User } from "discord.js";
import { DmHandler } from "./GenericDm";

export class DMHandlerImpl implements DmHandler {


    private constructor() { }

    static async init(): Promise<DmHandler> {
        const dm = new DMHandlerImpl();
        return dm
    }

    onReady(client: Client): Promise<string> {
        return Promise.resolve('DM handler loaded');
    }

    onSlashCommand(interaction: BaseCommandInteraction): Promise<unknown> {
        return interaction.reply({ content: `No action specified`, ephemeral: true })
        //return this.commandManager.onSlashCommand(interaction);
    }

    onButton(interaction: ButtonInteraction): Promise<unknown> {
        return interaction.reply({ content: `No action specified`, ephemeral: true })
    }

    onSelectMenu(interaction: SelectMenuInteraction): Promise<unknown> {
        return interaction.reply({ content: `No action specified`, ephemeral: true })
    }

    onMessage(message: Message): Promise<unknown> {
        return Promise.resolve(`message received from ${message.author.id}`);
    }


    onMessageDelete(deletedMessage: Message): Promise<unknown> {
        return Promise.resolve();
    }

    onMessageReactionAdd(reaction: MessageReaction, user: User): Promise<unknown> {
        switch (reaction.emoji.name) {
            case '🗑️': case '🗑':
                if (reaction.message.deletable && user.id !== reaction.client.user.id)
                    return reaction.message.delete();

            default:
                return Promise.resolve();
        }
    }

    onMessageReactionRemove(reaction: MessageReaction, user: User): Promise<unknown> {
        return Promise.resolve();
    }
}