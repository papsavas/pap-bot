import {
    ApplicationCommand, ApplicationCommandManager, Collection,
    CommandInteraction, ContextMenuInteraction, GuildApplicationCommandManager, Message, Snowflake
} from "discord.js";
import { GenericCommand } from "../../GenericCommand";

export interface CommandManager {
    readonly commands: GenericCommand[];
    onManualCommand(message: Message): Promise<unknown>;
    onSlashCommand(interaction: CommandInteraction | ContextMenuInteraction): Promise<unknown>
    updateCommands(commandManager: ApplicationCommandManager | GuildApplicationCommandManager):
        Promise<Collection<Snowflake, ApplicationCommand<{}>>>
    clearCommands(commandManager: ApplicationCommandManager | GuildApplicationCommandManager, guildId?: Snowflake): Promise<unknown>;
}