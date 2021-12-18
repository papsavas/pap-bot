import { ChatInputApplicationCommandData, Collection, CommandInteraction, Message, Permissions, Snowflake } from "discord.js";
import { adminUsers, roles as kepRoles } from "../../../../values/KEP/IDs.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_adminCmd } from "../Interf/KEP_adminCmd";

const [onLiteral, offLiteral] = ["on", "off"];

export class KEP_adminCmdImpl extends AbstractGuildCommand implements KEP_adminCmd {

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `admin`;
    protected _guide = `Enables/Disables ADMIN permission`;
    protected _usage = `${this.keyword}`;

    private constructor() { super() }

    static async init(): Promise<KEP_adminCmd> {
        const cmd = new KEP_adminCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    private readonly _aliases = this.mergeAliases
        (
            ['adm', 'admin'], this._keyword
        );


    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: onLiteral,
                    description: "Enables ADMIN permission",
                    type: "SUB_COMMAND"
                },
                {
                    name: offLiteral,
                    description: "Disables ADMIN permission",
                    type: "SUB_COMMAND"
                }
            ]
        }
    }
    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
        await interaction.deferReply({ ephemeral: true })
        if (!adminUsers.includes(interaction.user.id))
            return interaction.editReply(`Δεν είστε διαχειριστής`);
        const role = interaction.guild.roles.cache.get(kepRoles.admin);
        if (interaction.options.getSubcommand(true) === onLiteral)
            return role?.setPermissions(Permissions.FLAGS.ADMINISTRATOR, "interaction switch")
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
            return role?.setPermissions(Permissions.FLAGS.ADMINISTRATOR, "command switch")
        else if (arg1 === offLiteral)
            return role?.setPermissions(Permissions.FLAGS.ADMINISTRATOR, "command switch")

        else {
            const role = guild.roles.cache.get(kepRoles.admin)
            return role.permissions.has(Permissions.FLAGS.ADMINISTRATOR) ?
                role.setPermissions(0n, "interaction switch") :
                role.setPermissions(Permissions.FLAGS.ADMINISTRATOR, "interaction switch")
        }
    }

    getAliases(): string[] {
        return this._aliases;
    }


}