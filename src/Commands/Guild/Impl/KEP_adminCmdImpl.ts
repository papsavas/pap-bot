import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData, ChatInputCommandInteraction, Collection, Message, PermissionFlagsBits, Snowflake } from "discord.js";
import { adminUsers, roles as kepRoles } from "../../../../values/KEP/IDs.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_adminCmd } from "../Interf/KEP_adminCmd";

const [onLiteral, offLiteral] = ["on", "off"];

export class KEP_adminCmdImpl extends AbstractGuildCommand implements KEP_adminCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `admin`;
    readonly guide = `Enables/Disables ADMIN permission`;
    readonly usage = `${this.keyword}`;

    private constructor() { super() }

    static async init(): Promise<KEP_adminCmd> {
        const cmd = new KEP_adminCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    readonly aliases = this.mergeAliases
        (
            ['adm', 'admin'], this.keyword
        );


    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: onLiteral,
                    description: "Enables ADMIN permission",
                    type: ApplicationCommandOptionType.Subcommand
                },
                {
                    name: offLiteral,
                    description: "Disables ADMIN permission",
                    type: ApplicationCommandOptionType.Subcommand
                }
            ]
        }
    }
    async interactiveExecute(interaction: ChatInputCommandInteraction): Promise<unknown> {
        await interaction.deferReply({ ephemeral: true })
        if (!adminUsers.includes(interaction.user.id))
            return interaction.editReply(`Δεν είστε διαχειριστής`);
        const role = interaction.guild.roles.cache.get(kepRoles.admin);
        if (interaction.options.getSubcommand(true) === onLiteral)
            return role?.setPermissions(PermissionFlagsBits.Administrator, "interaction switch")
                .then(() => interaction.editReply(`admin perms enabled`))
        else if (interaction.options.getSubcommand(true) === offLiteral)
            return role?.setPermissions(0n, "interaction switch")
                .then(() => interaction.editReply(`admin perms disabled`))
        else
            return new Error("Invalid subcommand option for KEP_adminSwitch");
    }

    async execute(message: Message, { arg1 }: commandLiteral): Promise<unknown> {
        const { guild, author } = message;
        if (!adminUsers.includes(author.id))
            return message.reply({
                content: `Δεν είστε διαχειριστής`
            });
        const role = guild.roles.cache.get(kepRoles.admin)
        if (arg1 === onLiteral)
            return role?.setPermissions(PermissionFlagsBits.Administrator, "command switch")
        else if (arg1 === offLiteral)
            return role?.setPermissions(PermissionFlagsBits.Administrator, "command switch")

        else {
            const role = guild.roles.cache.get(kepRoles.admin)
            return role.permissions.has(PermissionFlagsBits.Administrator) ?
                role.setPermissions(0n, "interaction switch") :
                role.setPermissions(PermissionFlagsBits.Administrator, "interaction switch")
        }
    }




}