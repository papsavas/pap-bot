import { ButtonInteraction, CacheType, CommandInteraction, Message, MessageReaction, SelectMenuInteraction, User } from 'discord.js';
import { MockMessageCmdImpl } from '../../Commands/Global/Impl/mockMessageCmdImpl';
import { tictactoeCmdImpl } from '../../Commands/Global/Impl/tictactoeCmdImpl';
import { userNotesCmdImpl } from '../../Commands/Global/Impl/userNotesCmdImpl';
import { GlobalCommandManagerImpl } from '../../Commands/Managers/Impl/GlobalCommandManagerImpl';
import { GlobalCommandManager } from '../../Commands/Managers/Interf/GlobalCommandManager';
import AbstractHandler from '../AbstractHandler';
import { GlobalCommandHandler } from './GlobalCommandHandler';

const globalCommands = [
    MockMessageCmdImpl, tictactoeCmdImpl,
    userNotesCmdImpl
]
export class GlobalCommandHandlerImpl extends AbstractHandler implements GlobalCommandHandler {

    commandManager: GlobalCommandManager;

    private constructor() {
        super("GlobalCommand Handler");
    }

    static async init(): Promise<GlobalCommandHandler> {
        const handler = new GlobalCommandHandlerImpl();
        handler.commandManager = new GlobalCommandManagerImpl(
            await Promise.all(globalCommands.map(cmd => cmd.init()))
        );
        return handler;
    }

    onCommand(interaction: CommandInteraction): Promise<unknown> {
        return this.commandManager.onCommand(interaction);
    }
    onButton(interaction: ButtonInteraction<CacheType>): Promise<unknown> {
        throw new Error('Method not implemented.');
    }
    onSelectMenu(interaction: SelectMenuInteraction<CacheType>): Promise<unknown> {
        throw new Error('Method not implemented.');
    }
    onMessage(message: Message<boolean>): Promise<unknown> {
        throw new Error('Method not implemented.');
    }
    onMessageDelete(deletedMessage: Message<boolean>): Promise<unknown> {
        throw new Error('Method not implemented.');
    }
    onMessageReactionAdd(messageReaction: MessageReaction, user: User): Promise<unknown> {
        throw new Error('Method not implemented.');
    }
    onMessageReactionRemove(messageReaction: MessageReaction, user: User): Promise<unknown> {
        throw new Error('Method not implemented.');
    }
}