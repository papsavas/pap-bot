import {
    ApplicationCommand, ApplicationCommandManager, Collection,
    CommandInteraction, GuildApplicationCommandManager, Message, Snowflake
} from "discord.js";
import { GenericCommand } from "../../GenericCommand";

export interface GuildCommandManager {
    readonly commands: GenericCommand[];
    onCommand(message: Message): Promise<any>;
    onSlashCommand(interaction: CommandInteraction): Promise<any>;
    fetchGuildCommands(commandManager: GuildApplicationCommandManager)
        : Promise<Collection<Snowflake, ApplicationCommand>>;

}