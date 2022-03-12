
import { ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, Collection, CommandInteraction, Message, MessageAttachment, PermissionFlagsBits, Snowflake } from "discord.js";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { fetchCourses, fetchTeacherCourses, linkTeacherToCourse, unlinkTeacherFromCourse } from "../../../Queries/KEP/Course";
import { fetchTeachers } from "../../../Queries/KEP/Teacher";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_courseTeacherCmd } from "../Interf/KEP_courseTeacherCmd";

const [linkLiteral, unlinkLiteral, listLiteral] = ['link', 'unlink', 'list'];
const [codeLiteral, usernameLiteral] = ['code', 'username'];
export class KEP_courseTeacherCmdImpl extends AbstractGuildCommand implements KEP_courseTeacherCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `course_teacher`;
    readonly guide = `Συσχέτιση μεταξύ μαθήματος και καθηγητή`;
    readonly usage = `${this.keyword} link | unlink <course_code> <teacher_username> | list`;
    private constructor() { super() }
    static async init(): Promise<KEP_courseTeacherCmd> {
        const cmd = new KEP_courseTeacherCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    readonly aliases = this.mergeAliases
        (
            ["courseteacher", "teachercourse", "teacher_course", "course_teacher"], this.keyword
        );
    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: linkLiteral,
                    description: "Συνδέει ένα μάθημα με καθηγητ@",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: codeLiteral,
                            description: "Ο κωδικός του μαθήματος",
                            type: ApplicationCommandOptionType.String,
                            required: true
                        },
                        {
                            name: usernameLiteral,
                            description: "Το username καθηγητ@",
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                },
                {
                    name: unlinkLiteral,
                    description: "Αποσυνδέει καθηγητ@ από ένα μάθημα",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: codeLiteral,
                            description: "Ο κωδικός του μαθήματος",
                            type: ApplicationCommandOptionType.String,
                            required: true
                        },
                        {
                            name: usernameLiteral,
                            description: "Το username καθηγητ@",
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                },

                {
                    name: listLiteral,
                    description: `Εμφανίζει καταχωρημένες διδασκαλίες`,
                    type: ApplicationCommandOptionType.Subcommand,
                }
            ]
        }
    }
    async interactiveExecute(interaction: ChatInputCommandInteraction): Promise<unknown> {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.permissions.has(PermissionFlagsBits.ManageGuild))
            return interaction.reply("`MANAGE_GUILD` permissions required")
        await interaction.deferReply({ ephemeral: false })
        const subcommand = interaction.options.getSubcommand(true);
        const code = interaction.options.getString(codeLiteral, false);
        const username = interaction.options.getString(usernameLiteral, false);
        return handleRequest(interaction, subcommand, code, username, this.usage);

    }
    async execute(message: Message, { arg1, arg2, arg3 }: commandLiteral): Promise<unknown> {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
            return message.reply("`MANAGE_GUILD` permissions required")
        return handleRequest(message, arg1, arg2, arg3, this.usage);
    }




}

const handleRequest = async (source: Message | CommandInteraction, action: string, code: string, username: string, usage: string) => {
    const respondText = (res: string) => source instanceof CommandInteraction ?
        source.editReply(res) : source.reply(res);

    const respondFile = (att: MessageAttachment) => source instanceof CommandInteraction ?

        source.editReply({ files: [att] }) : source.reply({ files: [att] });

    const respond = (content: string | MessageAttachment) =>
        typeof content === 'string' ? respondText(content) : respondFile(content);

    switch (action) {
        case linkLiteral:
            return respond(await link(code, username))
        case unlinkLiteral:
            return respond(await unlink(code, username))
        case listLiteral:
            return respond(await list())
        default:
            return respond(`Invalid Request\nusage:${usage}`)
    }

}

async function link(courseCode: string, teacherUsername: string) {
    return JSON.stringify(await linkTeacherToCourse(courseCode, teacherUsername))
}

async function unlink(courseCode: string, teacherUsername: string) {
    return JSON.stringify(await unlinkTeacherFromCourse(courseCode, teacherUsername))
}

async function list(): Promise<MessageAttachment> {
    const tc = await fetchTeacherCourses();
    const teachers = await fetchTeachers();
    const courses = await fetchCourses();
    const textArr = tc.map(el => {
        const teacher = teachers.find(t => t.uuid === el.teacher_id);
        const course = courses.find(c => c.uuid === el.course_id);
        return `${teacher.username} (${teacher.full_name}) - ${course.name} (${course.code})`
    });
    const buffer = Buffer.from(textArr.sort().join("\n"));
    return new MessageAttachment(buffer, new Date().toISOString() + "_teacher_courses.txt");
}

