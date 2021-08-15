import { ButtonInteraction, Client, CommandInteraction, Message, MessageReaction, SelectMenuInteraction, User } from "discord.js";
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

    onSlashCommand(interaction: CommandInteraction): Promise<unknown> {
        return interaction.reply({ content: `Dm commands coming soon`, ephemeral: true })
        //return this.commandManager.onSlashCommand(interaction);
    }

    onButton(interaction: ButtonInteraction): Promise<unknown> {
        return Promise.resolve(`button ${interaction.customId} received from ${interaction.user.id}`);
    }

    onSelectMenu(interaction: SelectMenuInteraction): Promise<unknown> {
        return Promise.resolve(`select ${interaction.customId} received from ${interaction.user.id}`);
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
                if (reaction.message.deletable)
                    return reaction.message.delete();

            default:
                return Promise.resolve();
        }
    }

    onMessageReactionRemove(reaction: MessageReaction, user: User): Promise<unknown> {
        return Promise.resolve();
    }
}