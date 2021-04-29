import {ApplicationCommandManager, GuildApplicationCommandManager, Interaction, Message} from "discord.js";
import { GenericCommand } from "./GenericCommand";

export interface CommandHandler {
    onCommand(message: Message): Promise<any>;
    onSlasCommand(interaction: Interaction): Promise<any>;
    registerApplicationCommands(commandManager: ApplicationCommandManager | GuildApplicationCommandManager): Promise<any>
}