import { ButtonInteraction, Client, CommandInteraction, Message, MessageReaction, SelectMenuInteraction, User } from "discord.js";
import { prefix } from "../../../botconfig.json";
import { userNotesCmdImpl } from "../../Commands/DM/Impl/userNotesCmdImpl";
import { DMCommandManagerImpl } from "../../Commands/Managers/Impl/DMCommandManagerImpl";
import { DMCommandManager } from "../../Commands/Managers/Interf/DMCommandManager";
import { DmHandler } from "./GenericDm";

const dmCommands = [
    userNotesCmdImpl
];
export class DMHandlerImpl implements DmHandler {
    commandManager: DMCommandManager;

    private constructor() { }

    static async init(): Promise<DmHandler> {
        const dm = new DMHandlerImpl();
        dm.commandManager = new DMCommandManagerImpl(
            await Promise.all(
                dmCommands
                    .map(cmd => cmd.init())
            )
        );
        return dm
    }

    onReady(client: Client): Promise<string> {
        return Promise.resolve('DM handler loaded');
    }

    onSlashCommand(interaction: CommandInteraction): Promise<unknown> {
        return this.commandManager.onSlashCommand(interaction);
    }

    onButton(interaction: ButtonInteraction): Promise<unknown> {
        return Promise.resolve(`button ${interaction.customId} received from ${interaction.user.id}`);
    }

    onSelectMenu(interaction: SelectMenuInteraction): Promise<unknown> {
        return Promise.resolve(`select ${interaction.customId} received from ${interaction.user.id}`);
    }

    onMessage(message: Message): Promise<unknown> {
        if (message.content.startsWith(prefix))
            return this.commandManager.onManualCommand(message);
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