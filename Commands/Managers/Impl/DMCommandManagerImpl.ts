import { ApplicationCommandData, ApplicationCommandManager, CommandInteraction, GuildApplicationCommandManager, Message } from "discord.js";
import { overrideCommands } from "../../../Queries/Generic/Commands";
import { GenericDMCommand } from "../../DM/GenericDMCommand";
import { DMCommandManager } from "../Interf/DMCommandManager";
import { CommandManagerImpl } from "./CommandManagerImpl";

export default class GlobalDMCommandManagerImpl extends CommandManagerImpl implements DMCommandManager {

    readonly commands: GenericDMCommand[];

    constructor(dmCommands: GenericDMCommand[]) {
        super(dmCommands);
        this.commands = dmCommands;
    }

    onManualCommand(message: Message): Promise<unknown> {
        throw new Error("Method not implemented.");
    }
    onSlashCommand(interaction: CommandInteraction): Promise<unknown> {
        throw new Error("Method not implemented.");
    }

    fetchCommandData(commands: GenericDMCommand[]) {
        const applicationCommands: ApplicationCommandData[] = [];
        for (const cmd of commands) {
            applicationCommands.push(cmd.getCommandData());
        }
        return applicationCommands;
    }

}