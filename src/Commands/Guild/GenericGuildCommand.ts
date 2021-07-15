import { ApplicationCommandData, Snowflake } from "discord.js";
import { GenericCommand } from "../GenericCommand";

export interface GenericGuildCommand extends GenericCommand {
    getCommandData(guildID: Snowflake): ApplicationCommandData;
}