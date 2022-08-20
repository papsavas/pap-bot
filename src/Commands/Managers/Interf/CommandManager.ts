import {
    ApplicationCommand, ApplicationCommandData, ApplicationCommandManager, ApplicationCommandResolvable, Collection, CommandInteraction, GuildApplicationCommandManager, Message, Snowflake
} from "discord.js";
import { GenericCommand } from "../../GenericCommand";

export interface CommandManager {
    readonly commands: GenericCommand[];
    onManualCommand(message: Message): Promise<unknown>;
    onCommand(interaction: CommandInteraction): Promise<unknown>
    registerCommand(
        commandManager: ApplicationCommandManager,
        commandData: ApplicationCommandData
    ): Promise<ApplicationCommand>;
    editCommand(
        commandManager: ApplicationCommandManager,
        command: ApplicationCommandResolvable,
        data: ApplicationCommandData,
        guildId: Snowflake
    ): Promise<ApplicationCommand>;
    editCommand(
        commandManager: GuildApplicationCommandManager,
        command: ApplicationCommandResolvable,
        data: ApplicationCommandData
    ): Promise<ApplicationCommand>;
    updateCommands(commandManager: GuildApplicationCommandManager | ApplicationCommandManager):
        Promise<Collection<Snowflake, ApplicationCommand<{}>>>
    clearCommands(commandManager: GuildApplicationCommandManager | ApplicationCommandManager): Promise<unknown>;

}