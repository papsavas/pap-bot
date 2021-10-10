import { ApplicationCommandData, Collection, CommandInteraction, Message, Snowflake } from "discord.js";
import { guildMap } from "../../..";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_teacherCmd } from "../Interf/KEP_teacherCmd";

export class KEP_teacherCmdImpl extends AbstractGuildCommand implements KEP_teacherCmd {

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `teacher`;
    protected _guide = `Διαχειρίζεται τους καθηγητές στη ΒΔ`;
    protected _usage = ``;
    private constructor() { super() }
    static async init(): Promise<KEP_teacherCmd> {
        const cmd = new KEP_teacherCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    private readonly _aliases = this.addKeywordToAliases
        (
            [], this.keyword
        );
    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT'
        }
    }
    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {

    }
    async execute(message: Message, { }: commandLiteral): Promise<unknown> {

    }
    getAliases(): string[] {
        return this._aliases;
    }
    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}