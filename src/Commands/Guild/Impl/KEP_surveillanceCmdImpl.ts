
import { ApplicationCommandData, Collection, CommandInteraction, Message, Snowflake } from "discord.js";
import { guildMap } from "../../..";
import { roles } from "../../../../values/KEP/IDs.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_surveillanceCmd } from "../Interf/KEP_surveillanceCmd";

export class KEP_surveillanceCmdImpl extends AbstractGuildCommand implements KEP_surveillanceCmd {

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `surveillance`;
    protected _guide = `(Ξε)κλειδώνει όλα τα κανάλια μαθημάτων`;
    protected _usage = `${this.keyword}`;
    private constructor() { super() }
    static async init(): Promise<KEP_surveillanceCmd> {
        const cmd = new KEP_surveillanceCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    private readonly _aliases = this.addKeywordToAliases
        (
            ["επιτήρηση", "επιτηρηση", "epitirisi", "epithrhsh"], this.keyword
        );
    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT'
        }
    }
    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
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
    getAliases(): string[] {
        return this._aliases;
    }
    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}