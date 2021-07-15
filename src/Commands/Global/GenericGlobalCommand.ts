import { ApplicationCommandData } from "discord.js";
import { GenericCommand } from "../GenericCommand";

export interface GenericGlobalCommand extends GenericCommand {
    getCommandData(): ApplicationCommandData;
}