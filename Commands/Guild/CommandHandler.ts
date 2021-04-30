import {ApplicationCommandManager, CommandInteraction, GuildApplicationCommandManager, Interaction, Message} from "discord.js";
import { GenericCommand } from "./GenericCommand";

export interface CommandHandler {
    onCommand(message: Message): Promise<any>;
    onSlashCommand(interaction: CommandInteraction): Promise<any>;
    registerApplicationCommands(commandManager: ApplicationCommandManager | GuildApplicationCommandManager): Promise<any>
}