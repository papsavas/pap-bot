import { BaseCommandInteraction } from "discord.js";
import { GlobalCommandManager } from "../../Commands/Managers/Interf/GlobalCommandManager";

export interface GlobalCommandHandler {
    readonly commandManager: GlobalCommandManager
    onSlashCommand(interaction: BaseCommandInteraction): Promise<any>;
}