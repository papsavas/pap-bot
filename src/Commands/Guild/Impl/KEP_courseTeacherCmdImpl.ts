
import { ApplicationCommandData, Collection, CommandInteraction, Message, Snowflake } from "discord.js";
import { guildMap } from "../../..";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { linkTeacherToCourse, unlinkTeacherFromCourse } from "../../../Queries/KEP/Course";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_courseTeacherCmd } from "../Interf/KEP_courseTeacherCmd";

const [linkLiteral, unlinkLiteral] = ['link', 'unlink'];
const [codeLiteral, usernameLiteral] = ['code', 'username'];
export class KEP_courseTeacherCmdImpl extends AbstractGuildCommand implements KEP_courseTeacherCmd {

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `course_teacher`;
    protected _guide = `Δημιουργεί συσχέτιση μεταξύ μαθήματος και καθηγητή`;
    protected _usage = `${this.keyword} link | unlink <course_code> <teacher_username>`;
    private constructor() { super() }
    static async init(): Promise<KEP_courseTeacherCmd> {
        const cmd = new KEP_courseTeacherCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    private readonly _aliases = this.addKeywordToAliases
        (
            ["courseteacher", "teachercourse", "teacher_course"], this.keyword
        );
    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: linkLiteral,
                    description: "Συνδέει ένα μάθημα με καθηγητ@",
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: codeLiteral,
                            description: "Ο κωδικός του μαθήματος",
                            type: "STRING",
                            required: true
                        },
                        {
                            name: usernameLiteral,
                            description: "Το username καθηγητ@",
                            type: "STRING",
                            required: true
                        }
                    ]
                },
                {
                    name: unlinkLiteral,
                    description: "Αποσυνδέει καθηγητ@ από ένα μάθημα",
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: codeLiteral,
                            description: "Ο κωδικός του μαθήματος",
                            type: "STRING",
                            required: true
                        },
                        {
                            name: usernameLiteral,
                            description: "Το username καθηγητ@",
                            type: "STRING",
                            required: true
                        }
                    ]
                }
            ]
        }
    }
    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.permissions.has("MANAGE_GUILD"))
            return interaction.reply("`MANAGE_GUILD` permissions required")
        await interaction.deferReply({ ephemeral: false })
        const subcommand = interaction.options.getSubcommand(true);
        const code = interaction.options.getString(codeLiteral, true);
        const username = interaction.options.getString(usernameLiteral, true);
        return interaction.editReply(await handleRequest(subcommand, code, username, this.usage));

    }
    async execute(message: Message, { arg1, arg2, arg3 }: commandLiteral): Promise<unknown> {
        if (!message.member.permissions.has("MANAGE_GUILD"))
            return message.reply("`MANAGE_GUILD` permissions required")
        return message.reply(await handleRequest(arg1, arg2, arg3, this.usage));
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}

const handleRequest = async (action: string, code: string, username: string, usage: string) => {
    if (action === linkLiteral)
        return link(code, username);
    else if (action === unlinkLiteral)
        return unlink(code, username);
    else return `Invalid Request\nusage:${usage}`;
}

async function link(courseCode: string, teacherUsername: string) {
    return JSON.stringify(await linkTeacherToCourse(courseCode, teacherUsername))
}

async function unlink(courseCode: string, teacherUsername: string) {
    return JSON.stringify(await unlinkTeacherFromCourse(courseCode, teacherUsername))
}