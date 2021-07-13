import { Client, Interaction, Message, MessageReaction, User, Collection, ApplicationCommand } from "discord.js";
import { userNotesCmdImpl } from "../../Commands/DM/Impl/userNotesCmdImpl";
import DMCommandManagerImpl from "../../Commands/Managers/Impl/DMCommandManagerImpl";
import { DMCommandManager } from "../../Commands/Managers/Interf/DMCommandManager";
import { DmHandler } from "./GenericDm";

export class DMHandlerImpl implements DmHandler {
    commandManager: DMCommandManager;

    private constructor() { }

    static async init(): Promise<DmHandler> {
        const dm = new DMHandlerImpl();
        dm.commandManager = new DMCommandManagerImpl(
            await Promise.all(
                [
                    userNotesCmdImpl
                ]
                    .map(cmd => cmd.init())
            )
        );
        return dm
    }

    onReady(client: Client): Promise<string> {
        return Promise.resolve('DM handler loaded');
    }
    onSlashCommand(interaction: Interaction): Promise<unknown> {
        throw new Error("Method not implemented.");
    }
    onMessage(message: Message): Promise<unknown> {
        throw new Error("Method not implemented.");
    }
    onMessageDelete(deletedMessage: Message): Promise<unknown> {
        throw new Error("Method not implemented.");
    }
    onMessageReactionAdd(messageReaction: MessageReaction, user: User): Promise<unknown> {
        throw new Error("Method not implemented.");
    }
    onMessageReactionRemove(messageReaction: MessageReaction, user: User): Promise<unknown> {
        throw new Error("Method not implemented.");
    }
}