import {
    ApplicationCommand, ApplicationCommandData, ApplicationCommandManager, Collection, Snowflake
} from 'discord.js';
import { overrideCommands } from '../../../Queries/Generic/Commands';
import { GenericGuildCommand } from '../../Guild/GenericGuildCommand';
import { GuildCommandManager } from "../Interf/GuildCommandManager";
import { CommandManagerImpl } from './CommandManagerImpl';

if (process.env.NODE_ENV !== 'production')
    (await import('dotenv'))
        .config({ path: (await import('find-config')).read('.env') })  //load env variables
export class GuildCommandManagerImpl extends CommandManagerImpl implements GuildCommandManager {
    private readonly guildID: Snowflake;
    declare readonly commands: GenericGuildCommand[];

    constructor(guild_id: Snowflake, guildCommands: GenericGuildCommand[]) {
        super(guildCommands);
        this.guildID = guild_id;
    }

    fetchCommandData(commands: GenericGuildCommand[]): ApplicationCommandData[] {
        const applicationCommands: ApplicationCommandData[] = [];
        for (const cmd of commands) {
            applicationCommands.push(cmd.getCommandData(this.guildID));
        }
        return applicationCommands;
    }

    //TODO: transform Collection
    saveCommandData(newCommands: Collection<Snowflake, ApplicationCommand>): Promise<void> {
        return overrideCommands(
            [...newCommands.mapValues(cmd => (
                {
                    keyword: cmd.name,
                    id: cmd.id,
                    guide: cmd.description,
                    global: false,
                    guild_id: this.guildID,
                    aliases: this.commands
                        .find((cmds) => cmds.matchAliases(cmd.name))?.aliases ?? []

                })
            ).values()]
        );
    }

    async updateCommands(commandManager: ApplicationCommandManager) {
        const newCommands = await super.updateCommands(commandManager);
        console.log(`___DONE_SYNCING_PERMS___`);
        return newCommands;
    }
}