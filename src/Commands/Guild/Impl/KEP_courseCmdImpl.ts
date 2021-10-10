import { ApplicationCommandData, Collection, CommandInteraction, Message, Snowflake } from "discord.js";
import { guildMap } from "../../..";
import { commandLiteral } from "../../../Entities/Generic/command";
import { Course } from "../../../Entities/KEP/Course";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import * as CourseQueries from "../../../Queries/KEP/Course";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_courseCmd } from "../Interf/KEP_CourseCmd";

const [_create, _update, _delete] = ["create", "update", "delete"];
export class KEP_courseCmdImpl extends AbstractGuildCommand implements KEP_courseCmd {

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `course`;
    protected _guide = `Διαχειρίζεται τα μαθήματα στη ΒΔ`;
    protected _usage = `${this.keyword} create | update | delete ...`;
    private constructor() { super() }
    static async init(): Promise<KEP_courseCmd> {
        const cmd = new KEP_courseCmdImpl();
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
        const subCmd = interaction.options.getSubcommand(true);
        const course: Course = null; //TODO: construct course from user data
        return CourseQueries[`${subCmd}Course`](course);
        /*
        switch (subCmd) {
            case _create: {
                return addCourse(course);
            }
            case _update: {
                return updateCourse(course);
            }
            case _delete: {
                return deleteCourse(course);
            }
        }
        */
    }
    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        return message.reply(`Παρακαλώ χρησιμοποιείστε Slash Command \`/${this.usage}\``)
    }
    getAliases(): string[] {
        return this._aliases;
    }
    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}