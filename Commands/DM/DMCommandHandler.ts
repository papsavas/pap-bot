import {
    ApplicationCommand, ApplicationCommandManager, Collection,
    CommandInteraction, GuildApplicationCommandManager, Message
} from "discord.js";

export interface DMCommandHandler {
    onCommand(message: Message): Promise<any>;
    onSlashCommand(interaction: CommandInteraction): Promise<any>;
    fetchApplicationCommands(commandManager?: ApplicationCommandManager)
        : Promise<Collection<string, ApplicationCommand>>
}