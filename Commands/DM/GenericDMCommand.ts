import { ApplicationCommandData, Snowflake } from "discord.js";
import { GenericCommand } from "../GenericCommand";

export default interface GenericDMCommand extends GenericCommand {
    getCommandData(): ApplicationCommandData;
}