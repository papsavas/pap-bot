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

    async updateCommands(commandManager: GuildApplicationCommandManager | ApplicationCommandManager) {
        const applicationCommands: ApplicationCommandData[] = this.fetchCommandData(this.commands);
        const registeredCommands = await commandManager.fetch();

        console.log(`guild commands changed. Refreshing...`);
        await commandManager.set([]); //remove previous 
        applicationCommands.push(this.helpCommandData);
        const newCommands = await commandManager.set(applicationCommands);
        //add to db
        await overrideCommands(newCommands.array().map(cmd => (
            {
                keyword: cmd.name,
                id: cmd.id,
                guide: cmd.description,
                aliases: this.commands
                    .find((cmds) => cmds.matchAliases(cmd.name))?.getAliases() ?? []

            }
        )));
        console.log(`---global commands updated---`);
        return newCommands;
    }

}