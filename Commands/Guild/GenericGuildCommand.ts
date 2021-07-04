import { ApplicationCommandData, Snowflake } from "discord.js";
import { GenericCommand } from "../GenericCommand";

export default interface GenericGuildCommand extends GenericCommand {
    type: "GUILD";
    getCommandData(guildID: Snowflake): ApplicationCommandData;
}