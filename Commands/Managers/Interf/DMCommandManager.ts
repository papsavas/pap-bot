import {
    ApplicationCommand, ApplicationCommandManager, Collection,
    CommandInteraction, GuildApplicationCommandManager, Message
} from "discord.js";
import { CommandManager } from "./CommandManager";

export interface DMCommandManager extends CommandManager {
    fetchApplicationCommands(commandManager?: ApplicationCommandManager)
        : Promise<Collection<string, ApplicationCommand>>
}