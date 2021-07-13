import {
    ApplicationCommand, ApplicationCommandManager, Collection,
    CommandInteraction, GuildApplicationCommandManager, Message
} from "discord.js";
import { CommandManager } from "./CommandManager";

export interface GlobalCommandManager extends CommandManager {

}