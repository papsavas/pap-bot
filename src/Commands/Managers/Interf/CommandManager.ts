import {
    ApplicationCommand, ApplicationCommandData, ApplicationCommandManager, ApplicationCommandResolvable, Collection,
    CommandInteraction, ContextMenuInteraction, GuildApplicationCommandManager, Message, Snowflake
} from "discord.js";
import { GenericCommand } from "../../GenericCommand";

export interface CommandManager {
    readonly commands: GenericCommand[];
    onManualCommand(message: Message): Promise<unknown>;
    onSlashCommand(interaction: CommandInteraction | ContextMenuInteraction): Promise<unknown>
    registerCommand(
        commandManager: ApplicationCommandManager | GuildApplicationCommandManager,
        commandData: ApplicationCommandData
    ): Promise<ApplicationCommand>;
    editCommand(commandManager: ApplicationCommandManager,
        command: ApplicationCommandResolvable,
        data: ApplicationCommandData,
        guildId: Snowflake): Promise<ApplicationCommand>;
    editCommand(
        commandManager: GuildApplicationCommandManager,
        command: ApplicationCommandResolvable,
        data: ApplicationCommandData
    ): Promise<ApplicationCommand>;
    updateCommands(commandManager: ApplicationCommandManager | GuildApplicationCommandManager):
        Promise<Collection<Snowflake, ApplicationCommand<{}>>>
    clearCommands(commandManager: ApplicationCommandManager | GuildApplicationCommandManager, guildId?: Snowflake): Promise<unknown>;

}