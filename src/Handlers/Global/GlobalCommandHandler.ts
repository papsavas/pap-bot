import { Interaction } from "discord.js";

export interface GlobalCommandHandler {
    onSlashCommand(interaction: Interaction): Promise<any>;
}