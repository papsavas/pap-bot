import { ApplicationCommandData, Collection, CommandInteraction, Message, Snowflake } from "discord.js";
import { guildMap } from "../../..";
import { categories, guildId, roles } from "../../../../values/KEP/IDs.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { Course, semesterRegex } from "../../../Entities/KEP/Course";
import { KepGuild } from "../../../Handlers/Guilds/Impl/KepGuild";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { addCourse, dropCourse, fetchCourses } from "../../../Queries/KEP/Course";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_courseCmd } from "../Interf/KEP_courseCmd";

const [createLiteral, deleteLiteral] = ["create", "delete"];
const [codeLiteral, nameLiteral, semesterLiteral] = ["code", "name", "semester"];
export class KEP_courseCmdImpl extends AbstractGuildCommand implements KEP_courseCmd {

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `course`;
    protected _guide = `Διαχειρίζεται τα μαθήματα στη ΒΔ`;
    protected _usage = `${this.keyword} create <code> <name> <semester> | delete <code>`;
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
            type: 'CHAT_INPUT',
            options: [
                {
                    name: createLiteral,
                    description: `Δημιουργεί ένα νέο μάθημα`,
                    type: 'SUB_COMMAND',
                    options: [
                        {
                            name: codeLiteral,
                            description: `Κωδικός μαθήματος`,
                            type: 'STRING',
                            required: true
                        },
                        {
                            name: nameLiteral,
                            description: `Όνομα μαθήματος (κεφαλαία)`,
                            type: 'STRING',
                            required: true
                        },
                        {
                            name: semesterLiteral,
                            description: `Εξάμηνο μαθήματος (9 για διδακτικη)`,
                            type: 'NUMBER',
                            required: true
                        }
                    ]
                },
                {
                    name: deleteLiteral,
                    description: `Διαγράφει ένα υπάρχον μάθημα`,
                    type: 'SUB_COMMAND',
                    options: [
                        {
                            name: codeLiteral,
                            description: `Κωδικός μαθήματος`,
                            type: 'STRING',
                            required: true
                        },

                    ]
                }
            ]
        }
    }
    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.permissions.has("MANAGE_GUILD"))
            return interaction.reply("`MANAGE_GUILD` permissions required")
        const subCmd = interaction.options.getSubcommand(true);
        await interaction.deferReply({ ephemeral: false });
        const code = interaction.options.getString(codeLiteral, true);
        const course: Course = {
            code,
            name: null,
            semester: null,
            channel_id: null,
            role_id: null
        };
        const kep = (guildMap.get(guildId) as KepGuild);
        try {
            switch (subCmd) {
                case createLiteral: {
                    course.name = interaction.options.getString(nameLiteral, true);
                    const sem = interaction.options.getNumber(semesterLiteral, true);

                    if (!sem.toString().match(semesterRegex))
                        return interaction.editReply('Λάθος τιμή στον αριθμό εξαμήνου. (1-8, 9 για μαθήματα διδακτικής)');
                    else
                        course.semester = sem as Course['semester'];

                    const courseRole = await interaction.guild.roles.create({
                        name: course.name,
                        reason: "created role for new course"
                    })

                    let categoryId: Snowflake;
                    //TODO: check if etos4 is not full
                    if (sem < 3)
                        categoryId = categories.etos1;
                    else if (sem < 5)
                        categoryId = categories.etos2;
                    else if (sem < 7)
                        categoryId = categories.etos3;
                    else if (sem < 9)
                        categoryId = categories.etos4_2;
                    else
                        categoryId = categories.didaktiki;

                    const courseChannel = await interaction.guild.channels.create(course.name, {
                        parent: categoryId,
                        topic: `Το κανάλι του μαθήματος **${course.name}**. Κοιτάτε πάντα τα  📌***pinned*** για σημαντικό υλικό`,
                        reason: "created channel for new course",
                        permissionOverwrites: [
                            {
                                id: roles.mod,
                                allow: ['MANAGE_MESSAGES'],
                                type: "role"
                            },
                            {
                                id: courseRole.id,
                                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
                                type: "role"
                            },
                            {
                                id: roles.pro,
                                allow: ['MENTION_EVERYONE'],
                                type: "role"
                            },
                            {
                                id: roles.overseer,
                                allow: ['VIEW_CHANNEL'],
                                type: "role"
                            },
                            {
                                id: guildId,
                                deny: ['VIEW_CHANNEL'],
                                type: "role"
                            }
                        ]
                    })
                    course.channel_id = courseChannel.id;
                    course.role_id = courseRole.id;
                    await addCourse(course);

                    //update kep cache
                    kep.courses = await fetchCourses();

                    //TODO: refresh courses selectmenu

                    return interaction.editReply(`Το μάθημα **${course.name} (${course.code})** δημιουργήθηκε με επιτυχία!.
Κανάλι: ${courseChannel.toString()}, Ρόλος: ${courseRole.toString()}`);
                }

                case deleteLiteral: {
                    await dropCourse(course.code)
                    const role = await interaction.guild.roles.fetch(course.role_id);
                    const channel = await interaction.guild.channels.fetch(course.channel_id);
                    await role.delete();
                    await channel.delete()
                    return interaction.editReply(`Επιτυχής Διαγραφή ${course.code} απο ΒΔ, ρόλο και κανάλι`);
                }
                default: {
                    return interaction.editReply("scenario not handled")
                }
            }
        } catch (error) {
            return interaction.editReply(error.toString());
        }

    }
    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        if (!message.member.permissions.has("MANAGE_GUILD"))
            return message.reply("`MANAGE_GUILD` permissions required")
        return message.reply(`Παρακαλώ χρησιμοποιείστε Slash Command \`/${this.usage}\``)
    }
    getAliases(): string[] {
        return this._aliases;
    }
    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}