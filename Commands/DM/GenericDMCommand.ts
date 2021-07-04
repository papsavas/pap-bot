import { ApplicationCommandData, Snowflake } from "discord.js";
import { GenericCommand } from "../GenericCommand";

export interface GenericDMCommand extends GenericCommand {
    getCommandData(): ApplicationCommandData;
}