import {
    ApplicationCommand, ApplicationCommandData, ApplicationCommandManager, ApplicationCommandPermissionData, Collection, GuildApplicationCommandManager, Snowflake
} from 'discord.js';
import { fetchCommandPerms, overrideCommands } from '../../../Queries/Generic/Commands';
import { GenericGuildCommand } from '../../Guild/GenericGuildCommand';
import { GuildCommandManager } from "../Interf/GuildCommandManager";
import { CommandManagerImpl } from './CommandManagerImpl';
require('dotenv').config();

export class GuildCommandManagerImpl extends CommandManagerImpl implements GuildCommandManager {
    private readonly guildID: Snowflake;
    declare readonly commands: GenericGuildCommand[];

    constructor(guild_id: Snowflake, guildCommands: GenericGuildCommand[]) {
        super(guildCommands);
        this.guildID = guild_id;
        this.commands = guildCommands;
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
                        .find((cmds) => cmds.matchAliases(cmd.name))?.getAliases() ?? []

                })
            ).values()]
        );
    }

    async updateCommands(commandManager: GuildApplicationCommandManager | ApplicationCommandManager) {
        const newCommands = await super.updateCommands(commandManager);
        await this.syncPermissions(commandManager, newCommands);
        return newCommands;
    }

    private syncPermissions(
        commandManager: ApplicationCommandManager | GuildApplicationCommandManager,
        commands: Collection<Snowflake, ApplicationCommand<{}>>
    ) {

        return Promise.all(
            commands.map(async cmd => {
                const dbPerms: ApplicationCommandPermissionData[] = (await fetchCommandPerms(cmd.guildId, cmd.id)).map(res => ({
                    id: res.role_id,
                    type: 'ROLE',
                    permission: true
                }))
                commandManager.permissions.set({
                    command: cmd.id,
                    guild: this.guildID,
                    permissions: dbPerms
                })
            })
        );
    }

    async clearCommands(commandManager: ApplicationCommandManager | GuildApplicationCommandManager) {
        return commandManager.set([]);
    }
}