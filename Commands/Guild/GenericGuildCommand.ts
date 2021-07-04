import { ApplicationCommandData, Snowflake } from "discord.js";
import { GenericCommand } from "../GenericCommand";

export default interface GenericGuildCommand extends GenericCommand {
    getCommandData(guildID: Snowflake): ApplicationCommandData;
}