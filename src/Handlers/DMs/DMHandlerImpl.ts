import { ButtonInteraction, CommandInteraction, Message, MessageReaction, SelectMenuInteraction, User } from "discord.js";
import AbstractHandler from "../AbstractHandler";
import { DmHandler } from "./GenericDm";

export class DMHandlerImpl extends AbstractHandler implements DmHandler {


    private constructor() {
        super("DM Handler")
    }

    static async init(): Promise<DmHandler> {
        const dm = new DMHandlerImpl();
        return dm;
    }

    onCommand(interaction: CommandInteraction): Promise<unknown> {
        return interaction.reply({ content: `No action specified`, ephemeral: true })
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