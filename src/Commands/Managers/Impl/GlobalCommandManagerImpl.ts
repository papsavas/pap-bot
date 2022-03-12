import { ApplicationCommand, ApplicationCommandData, ApplicationCommandManager, Collection, GuildApplicationCommandManager, Snowflake } from "discord.js";
import { dropAllCommandPerms, overrideCommands } from "../../../Queries/Generic/Commands";
import { GenericGlobalCommand } from "../../Global/GenericGlobalCommand";
import { GlobalCommandManager } from "../Interf/GlobalCommandManager";
import { CommandManagerImpl } from "./CommandManagerImpl";

export class GlobalCommandManagerImpl extends CommandManagerImpl implements GlobalCommandManager {
    declare readonly commands: GenericGlobalCommand[]
    constructor(globalCommands: GenericGlobalCommand[]) {
        super(globalCommands);
    }

    fetchCommandData(commands: GenericGlobalCommand[]): ApplicationCommandData[] {
        const applicationCommands: ApplicationCommandData[] = [];
        for (const cmd of commands) {
            applicationCommands.push(cmd.getCommandData());
        }
        return applicationCommands;
    }

    saveCommandData(newCommands: Collection<Snowflake, ApplicationCommand>): Promise<void> {
        return overrideCommands(
            newCommands.map(cmd => (
                {
                    keyword: cmd.name,
                    id: cmd.id,
                    guide: cmd.description,
                    global: true,
                    aliases: this.commands
                        .find((cmds) => cmds.matchAliases(cmd.name))?.aliases ?? []

                })
            )
        );
    }

    async clearCommands(commandManager: ApplicationCommandManager): Promise<unknown> {
        if (commandManager instanceof GuildApplicationCommandManager)
            await dropAllCommandPerms(commandManager.guild.id).catch(console.error);
        return commandManager.set([]);
    }
}