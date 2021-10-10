import { ApplicationCommandData, Collection, CommandInteraction, Message, Snowflake } from "discord.js";
import { guildMap } from "../../..";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_eventsCmd } from "../Interf/KEP_eventsCmd";

export class KEP_eventsCmdImpl extends AbstractGuildCommand implements KEP_eventsCmd {

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `events`;
    protected _guide = `Διαχειρίζεται τα events στο google calendar`;
    protected _usage = ``;
    private constructor() { super() }
    static async init(): Promise<KEP_eventsCmd> {
        const cmd = new KEP_eventsCmdImpl();
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