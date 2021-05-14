import {
    ApplicationCommand, ApplicationCommandManager, Collection,
    CommandInteraction, GuildApplicationCommandManager, Message, Snowflake
} from "discord.js";

export interface GuildCommandHandler {
    onCommand(message: Message): Promise<any>;
    onSlashCommand(interaction: CommandInteraction): Promise<any>;
    fetchGuildCommands(commandManager: GuildApplicationCommandManager)
        : Promise<Collection<Snowflake, ApplicationCommand>>
}