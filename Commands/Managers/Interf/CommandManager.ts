import { ApplicationCommandManager, CommandInteraction, Message } from "discord.js";
import { commandPermission } from "../../../Entities/Generic/commandPermission";
import { GenericCommand } from "../../GenericCommand";

export interface CommandManager {
    readonly commands: GenericCommand[];
    onManualCommand(message: Message): Promise<unknown>;
    onSlashCommand(interaction: CommandInteraction): Promise<unknown>
}