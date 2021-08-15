import { CommandInteraction } from 'discord.js';
import { MockMessageCmdImpl } from '../../Commands/Global/Impl/mockMessageCmdImpl';
import { PinMessageCmdImpl } from '../../Commands/Global/Impl/pinMessageCmdImpl';
import { tictactoeCmdImpl } from '../../Commands/Global/Impl/tictactoeCmdImpl';
import { UnpinMessageCmdImpl } from '../../Commands/Global/Impl/unpinMessageCmdImpl';
import { GlobalCommandManagerImpl } from '../../Commands/Managers/Impl/GlobalCommandManagerImpl';
import { GlobalCommandManager } from '../../Commands/Managers/Interf/GlobalCommandManager';
import { GlobalCommandHandler } from './GlobalCommandHandler';

const globalCommands = [
    MockMessageCmdImpl, tictactoeCmdImpl,
    PinMessageCmdImpl, UnpinMessageCmdImpl
]
export class GlobalCommandHandlerImpl implements GlobalCommandHandler {

    commandManager: GlobalCommandManager;

    private constructor() { }

    static async init(): Promise<GlobalCommandHandler> {
        const global = new GlobalCommandHandlerImpl();
        global.commandManager = new GlobalCommandManagerImpl(
            await Promise.all(globalCommands.map(cmd => cmd.init()))
        );
        return global;
    }
    onSlashCommand(interaction: CommandInteraction): Promise<unknown> {
        return this.commandManager.onSlashCommand(interaction);
    }
}