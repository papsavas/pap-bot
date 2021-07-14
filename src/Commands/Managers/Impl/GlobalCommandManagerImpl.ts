import { ApplicationCommand, ApplicationCommandData, Collection, CommandInteraction, Message, Snowflake } from "discord.js";
import { CommandType } from "../../../Entities/Generic/commandType";
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

    saveCommandData(newCommands: Collection<Snowflake, ApplicationCommand>): Promise<CommandType[]> {
        return overrideCommands(newCommands.array().map(cmd => (
            {
                keyword: cmd.name,
                id: cmd.id,
                guide: cmd.description,
                global: true,
                aliases: this.commands
                    .find((cmds) => cmds.matchAliases(cmd.name))?.getAliases() ?? []

            })
        ));
    }

}