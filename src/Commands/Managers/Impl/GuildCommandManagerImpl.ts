import {
    ApplicationCommand, ApplicationCommandData, ApplicationCommandManager, ApplicationCommandPermissionData, Collection, GuildApplicationCommandManager, Snowflake
} from 'discord.js';
import { fetchCommandPerms, overrideCommands } from '../../../Queries/Generic/Commands';
import { GenericGuildCommand } from '../../Guild/GenericGuildCommand';
import { GuildCommandManager } from "../Interf/GuildCommandManager";
import { CommandManagerImpl } from './CommandManagerImpl';
if (process.env.NODE_ENV !== 'production')
    require('dotenv').config({ path: require('find-config')('.env') })

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

    private async syncPermissions(
        commandManager: ApplicationCommandManager | GuildApplicationCommandManager,
        commands: Collection<Snowflake, ApplicationCommand<{}>>
    ) {
        for (const cmd of commands.values()) {
            const dbPerms: ApplicationCommandPermissionData[] = (await fetchCommandPerms(cmd.guildId, cmd.id))
                .map(res => ({
                    id: res.role_id,
                    type: 'ROLE',
                    permission: true
                }))
            if (dbPerms.every(p => p.id !== cmd.guildId))
                //disable defaultPermission
                await cmd.edit({
                    defaultPermission: false,
                    description: cmd.description,
                    name: cmd.name
                })
            await commandManager.permissions.set({
                command: cmd.id,
                guild: cmd.guildId,
                permissions: dbPerms
            })
                .then(() => console.log(`Synced permissions for ${cmd.name} - ${cmd.guild.name}`))
        }
    }

    async clearCommands(commandManager: ApplicationCommandManager | GuildApplicationCommandManager) {
        return commandManager.set([]);
    }
}