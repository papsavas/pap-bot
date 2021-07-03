import { CommandInteraction, Message } from "discord.js";
import { GenericCommand } from "../../GenericCommand";

export interface CommandManager {
    readonly commands: GenericCommand[];
    onManualCommand(message: Message): Promise<unknown>;
    onSlashCommand(interaction: CommandInteraction): Promise<unknown>
}