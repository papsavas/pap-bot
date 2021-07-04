import { ApplicationCommand, ApplicationCommandData, ApplicationCommandManager, Collection, CommandInteraction, GuildApplicationCommandManager, GuildResolvable, Message } from "discord.js";
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
        console.log(`---dm commands updated---`);
        return newCommands;
    }

}