import { ApplicationCommandOptionData, ApplicationCommandPermissions, ChatInputApplicationCommandData, CommandInteraction, Constants, Guild, Message, MessageEmbed, Snowflake } from 'discord.js';
import { commandLiteral } from '../../../Entities/Generic/command';
import { guildMap } from "../../../index";
import { fetchCommandID, fetchCommandPerms } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { showPermsCmd } from "../Interf/showPermsCmd";


//TODO: ensure non empty embed fields

const cmdOptionLiteral: ApplicationCommandOptionData['name'] = 'command';
export class ShowPermsCmdsImpl extends AbstractGuildCommand implements showPermsCmd {

    protected _id: Snowflake;
    protected _keyword = `perms`;
    protected _guide = `Shows permissions for specific command`;
    protected _usage = `perms <command>`;

    private constructor() { super() }

    static async init(): Promise<showPermsCmd> {
        const cmd = new ShowPermsCmdsImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['perms', 'perm', 'showperms', 'show_perms'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: cmdOptionLiteral,
                    description: 'permissions for command',
                    type: 'STRING',
                    required: true,
                    choices: guildMap.get(guild_id).commandManager.commands
                        .map(cmd => ({ name: cmd.keyword, value: cmd.keyword }))
                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const commandLiteral = interaction.options.getString(cmdOptionLiteral, true);
        const command_id: Snowflake = guildMap.get(interaction.guildId).commandManager.commands
            .find(cmd => cmd.matchAliases(commandLiteral))?.id
        if (!command_id)
            return interaction.reply({
                content: `command ${commandLiteral} not found`,
                ephemeral: true
            });
        const guild_prefix = guildMap.get(interaction.guildId).getSettings().prefix;
        await interaction.deferReply({ ephemeral: true });
        const [apiResponse, manualResponse] = await generateResponses(interaction.guild, command_id);
        return interaction.editReply({
            embeds: [
                buildEmbed(guild_prefix, commandLiteral, apiResponse, manualResponse)
            ]
        });
    }

    async execute(message: Message, { arg1 }: commandLiteral) {
        const commandLiteral = arg1;
        const command_id: Snowflake = guildMap.get(message.guildId).commandManager.commands
            .find(cmd => cmd.matchAliases(commandLiteral))?.id
        if (!command_id)
            return message.reply({
                content: `command ${commandLiteral} not found`
            });
        const guild_prefix = guildMap.get(message.guildId).getSettings().prefix;
        const [apiResponse, manualResponse] = await generateResponses(message.guild, command_id);
        return message.reply({
            embeds: [
                buildEmbed(guild_prefix, commandLiteral, apiResponse, manualResponse)
            ]
        });
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}

async function generateResponses(guild: Guild, command_id: Snowflake): Promise<[string, string]> {
    const commandPerms = await fetchCommandPerms(guild.id, command_id);
    const reqRoles = await Promise.all(commandPerms.map(cp => guild.roles.fetch(cp.role_id)));
    let apiPerms: ApplicationCommandPermissions[];
    try {
        apiPerms = await guild.commands.permissions.fetch({ command: command_id })
    } catch (err) {
        if (err.code === Constants.APIErrors['UNKNOWN_APPLICATION_COMMAND_PERMISSIONS'])
            apiPerms = [];
        else
            console.log(err);
    }
    const allowedApiPerms = apiPerms.filter(perm => perm.permission)
    const apiResponse: string = allowedApiPerms.length > 0 ?
        allowedApiPerms.map(perm => `<@&${perm.id}>`).toString()
        : `<@&${guild.id}>` //allowed for @everyone

    const manualResponse: string = reqRoles.length > 0 ?
        reqRoles.toString() : `<@&${guild.id}>` //allowed for @everyone

    return [apiResponse, manualResponse];
}

function buildEmbed(guild_prefix: string, commandLiteral: string, apiResponse: string, manualResponse: string) {
    return new MessageEmbed({
        title: guild_prefix + commandLiteral,
        description: `Enabled for :`,
        fields: [
            {
                name: `Slash Command: **\`/${commandLiteral}\`**`,
                value: apiResponse

            },
            {
                name: `Manual Command: **\`${guild_prefix}${commandLiteral}\`**`,
                value: manualResponse
            }
        ]
    })
}