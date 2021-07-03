import {
    ApplicationCommand, ApplicationCommandManager, Collection,
    CommandInteraction, GuildApplicationCommandManager, Message, Snowflake
} from "discord.js";
import { GenericCommand } from "../../GenericCommand";
import { CommandManager } from "./CommandManager";

export interface GuildCommandManager extends CommandManager {

}