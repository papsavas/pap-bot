
import { ApplicationCommandData, ApplicationCommandType, ChatInputCommandInteraction, Collection, Message, Snowflake } from "discord.js";
import { roles } from "../../../../values/KEP/IDs.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_surveillanceCmd } from "../Interf/KEP_surveillanceCmd";

export class KEP_surveillanceCmdImpl extends AbstractGuildCommand implements KEP_surveillanceCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `surveillance`;
    readonly guide = `(Ξε)κλειδώνει όλα τα κανάλια μαθημάτων`;
    readonly usage = `${this.keyword}`;
    private constructor() { super() }
    static async init(): Promise<KEP_surveillanceCmd> {
        const cmd = new KEP_surveillanceCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    readonly aliases = this.mergeAliases
        (
            ["επιτήρηση", "επιτηρηση", "epitirisi", "epithrhsh"], this.keyword
        );
    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput
        }
    }
    async interactiveExecute(interaction: ChatInputCommandInteraction): Promise<unknown> {
        await interaction.deferReply({ ephemeral: true });
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const role = await interaction.guild.roles.fetch(roles.overseer);
        return (member.roles.cache.has(roles.overseer) ?
            member.roles.remove(role) : member.roles.add(role))
            .then(() => interaction.editReply("Χρησιμοποιείτε ξανά την εντολή για εμφανίσετε/αποκρύψετε τα κανάλια"))
            .catch(err => interaction.editReply(err.toString()))

    }
    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        const { guild, member } = message;
        const role = await guild.roles.fetch(roles.overseer);
        return (member.roles.cache.has(roles.overseer) ?
            member.roles.remove(role) : member.roles.add(role))
            .catch(err => message.reply(err.toString()))
    }


}