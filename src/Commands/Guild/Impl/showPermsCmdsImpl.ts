import { ApplicationCommandOptionData, ApplicationCommandOptionType, ApplicationCommandPermissions, ApplicationCommandType, ChatInputApplicationCommandData, ChatInputCommandInteraction, Collection, Embed, Guild, Message, RESTJSONErrorCodes, Snowflake } from 'discord.js';
import { commandLiteral } from '../../../Entities/Generic/command';
import { guilds } from "../../../index";
import { fetchCommandID, fetchCommandPerms } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { showPermsCmd } from "../Interf/showPermsCmd";

const cmdOptionLiteral: ApplicationCommandOptionData['name'] = 'command';

//TODO: include in command_perms command
export class ShowPermsCmdsImpl extends AbstractGuildCommand implements showPermsCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `perms`;
    readonly guide = `Shows permissions for specific command`;
    readonly usage = `${this.keyword} <command>`;

    private constructor() { super() }

    static async init(): Promise<showPermsCmd> {
        const cmd = new ShowPermsCmdsImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    readonly aliases = this.mergeAliases
        (
            ['perms', 'perm', 'showperms', 'show_perms'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: cmdOptionLiteral,
                    description: 'permissions for command',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: guilds.get(guild_id).commandManager.commands
                        .map(cmd => ({ name: cmd.keyword, value: cmd.keyword }))
                }
            ]
        }
    }

    async interactiveExecute(interaction: ChatInputCommandInteraction): Promise<any> {
        const commandLiteral = interaction.options.getString(cmdOptionLiteral, true);
        const command_id: Snowflake = (await fetchCommandID(commandLiteral, interaction.guildId)).firstKey();
        if (!command_id)
            return interaction.reply({
                content: `command ${commandLiteral} not found`,
                ephemeral: true
            });
        const guild_prefix = guilds.get(interaction.guildId).getSettings().prefix;
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
        const command_id: Snowflake = (await fetchCommandID(commandLiteral, message.guildId)).firstKey();
        if (!command_id)
            return message.reply({
                content: `command ${commandLiteral} not found`
            });
        const guild_prefix = guilds.get(message.guildId).getSettings().prefix;
        const [apiResponse, manualResponse] = await generateResponses(message.guild, command_id);
        return message.reply({
            embeds: [
                buildEmbed(guild_prefix, commandLiteral, apiResponse, manualResponse)
            ]
        });
    }




}

async function generateResponses(guild: Guild, command_id: Snowflake): Promise<[string, string]> {

    const commandPerms = await fetchCommandPerms(guild.id, command_id);
    const reqRoles = await Promise.all(commandPerms.map(cp => guild.roles.fetch(cp.role_id)));
    let apiPerms: ApplicationCommandPermissions[];
    try {
        apiPerms = await guild.commands.permissions.fetch({ command: command_id })
    } catch (err) {
        if (err.code === RESTJSONErrorCodes.UnknownApplicationCommandPermissions)
            apiPerms = [];
        else
            console.log(err);
    }
    const allowedApiPerms = apiPerms.filter(perm => perm.permission)
    const apiResponse: string = allowedApiPerms.length > 0 ?
        allowedApiPerms
            .map(perm => `<@&${perm.id}>`)
            .toString()
        : `<@&${guild.id}>` //allowed for @everyone

    const manualResponse: string = reqRoles.length > 0 ?
        reqRoles.toString() : `<@&${guild.id}>` //allowed for @everyone

    return [apiResponse, manualResponse];
}

function buildEmbed(guild_prefix: string, commandLiteral: string, apiResponse: string, manualResponse: string) {
    return new Embed({
        title: guild_prefix + commandLiteral,
        description: `Allowed for :`,
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