import { CommandInteraction, Interaction } from 'discord.js';
import { MockMessageCmdImpl } from '../../Commands/Global/Impl/mockMessageCmdImpl';
import GlobalCommandManagerImpl from '../../Commands/Managers/Impl/GlobalCommandManagerImpl';
import { GlobalCommandManager } from '../../Commands/Managers/Interf/GlobalCommandManager';
import { GlobalCommandHandler } from './GlobalCommandHandler';
export class GlobalCommandHandlerImpl implements GlobalCommandHandler {

    commandManager: GlobalCommandManager;

    private constructor() { }

    static async init(): Promise<GlobalCommandHandler> {
        const global = new GlobalCommandHandlerImpl();
        global.commandManager = new GlobalCommandManagerImpl(
            await Promise.all(
                [
                    MockMessageCmdImpl
                ]
                    .map(cmd => cmd.init())
            )
        );
        return global;
    }
    onSlashCommand(interaction: CommandInteraction): Promise<unknown> {
        throw new Error('Method not implemented.');
    }
}