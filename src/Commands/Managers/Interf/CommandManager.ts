import {
    ApplicationCommand, ApplicationCommandManager, Collection,
    CommandInteraction, GuildApplicationCommandManager, Message, Snowflake
} from "discord.js";
import { GenericCommand } from "../../GenericCommand";

export interface CommandManager {
    readonly commands: GenericCommand[];
    onManualCommand(message: Message): Promise<unknown>;
    onSlashCommand(interaction: CommandInteraction): Promise<unknown>
    updateCommands(commandManager: ApplicationCommandManager | GuildApplicationCommandManager)
        : Promise<Collection<Snowflake, ApplicationCommand<{}>>>
}