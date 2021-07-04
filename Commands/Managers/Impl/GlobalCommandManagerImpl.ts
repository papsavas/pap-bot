import { ApplicationCommand, ApplicationCommandData, ApplicationCommandManager, Collection, CommandInteraction, GuildApplicationCommandManager, GuildResolvable, Message } from "discord.js";
import { overrideCommands } from "../../../Queries/Generic/Commands";
import GenericGlobalCommand from "../../Global/GenericGlobalCommand";
import { GlobalCommandManager } from "../Interf/GlobalCommandManager";
import { CommandManagerImpl } from "./CommandManagerImpl";

export default class GlobalCommandManagerImpl extends CommandManagerImpl implements GlobalCommandManager {


    readonly commands: GenericGlobalCommand[]
    constructor(globalCommands: GenericGlobalCommand[]) {
        super(globalCommands);
        this.commands = globalCommands;
    }

    onManualCommand(message: Message): Promise<any> {
        throw new Error("Method not implemented.");
    }
    onSlashCommand(interaction: CommandInteraction): Promise<any> {
        throw new Error("Method not implemented.");
    }

    fetchCommandData(commands: GenericGlobalCommand[]): ApplicationCommandData[] {
        const applicationCommands: ApplicationCommandData[] = [];
        for (const cmd of commands) {
            applicationCommands.push(cmd.getCommandData());
        }
        return applicationCommands;
    }

}