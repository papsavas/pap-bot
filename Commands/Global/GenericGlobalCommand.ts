import { ApplicationCommandData, Snowflake } from "discord.js";
import { GenericCommand } from "../GenericCommand";

export default interface GenericGlobalCommand extends GenericCommand {
    type: "GLOBAL"
    getCommandData(): ApplicationCommandData;
}