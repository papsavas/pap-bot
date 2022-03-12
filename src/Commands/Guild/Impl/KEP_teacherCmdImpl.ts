import { ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, Collection, Embed, Message, MessageAttachment, PermissionFlagsBits, Snowflake } from "discord.js";
import { commandLiteral } from "../../../Entities/Generic/command";
import { Teacher } from "../../../Entities/KEP/Teacher";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { addTeacher, deleteTeacher, fetchTeachers } from "../../../Queries/KEP/Teacher";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_teacherCmd } from "../Interf/KEP_teacherCmd";

const [createLiteral, deleteLiteral, listLiteral] = ["create", "delete", "list"];
const [
    usernameLiteral,
    fullNameLiteral,
    phoneNumberLiteral,
    pictureUrlLiteral,
    websiteLiteral
] = [
        "username",
        "full_name",
        "phone_number",
        "picture_url",
        "website"
    ];
export class KEP_teacherCmdImpl extends AbstractGuildCommand implements KEP_teacherCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `teacher`;
    readonly guide = `Διαχειρίζεται τους καθηγητές στη ΒΔ`;
    readonly usage = `${this.keyword} create <username> <full_name> <phone_number>, [picture_url], [website] | delete <username> | list`;
    private constructor() { super() }
    static async init(): Promise<KEP_teacherCmd> {
        const cmd = new KEP_teacherCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    readonly aliases = this.mergeAliases
        (
            ["teachers"], this.keyword
        );
    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: createLiteral,
                    description: `Δημιουργεί νέο καθηγητ@`,
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: usernameLiteral,
                            description: `Αναγνωριστικό καθηγητ@`,
                            type: ApplicationCommandOptionType.String,
                            required: true
                        },
                        {
                            name: fullNameLiteral,
                            description: `Ονοματεπώνυμο Καθηγητ@`,
                            type: ApplicationCommandOptionType.String,
                            required: true
                        },
                        {
                            name: phoneNumberLiteral,
                            description: `Τηλέφωνο Επικοινωνίας`,
                            type: ApplicationCommandOptionType.String,
                            required: true
                        },
                        {
                            name: pictureUrlLiteral,
                            description: `Link Φωτογραφίας`,
                            type: ApplicationCommandOptionType.String,
                            required: false
                        },
                        {
                            name: websiteLiteral,
                            description: `Προσωπική Ιστοσελίδα`,
                            type: ApplicationCommandOptionType.String,
                            required: false
                        }
                    ]
                },
                {
                    name: deleteLiteral,
                    description: `Διαγραφή Καθηγητ@`,
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: usernameLiteral,
                            description: `Αναγνωριστικό Καθηγητ@`,
                            type: ApplicationCommandOptionType.String,
                            required: true
                        },

                    ]
                },

                {
                    name: listLiteral,
                    description: `Εμφανίζει το καταχωρημένο Ακαδημαϊκό Προσωπικό`,
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

        switch (subcommand) {
            case createLiteral: {
                const username = interaction.options.getString(usernameLiteral, true);
                const full_name = interaction.options.getString(fullNameLiteral, true);
                const phone_number = interaction.options.getString(phoneNumberLiteral, true);
                const picture_url = interaction.options.getString(pictureUrlLiteral);
                const website = interaction.options.getString(websiteLiteral);
                const email = `${username}@uom.edu.gr`;
                const teacher: Teacher = {
                    username,
                    full_name,
                    email,
                    phone_number: (phone_number as `${number}`),
                    courses: null,
                    picture_url,
                    website
                };

                return addTeacher(teacher)
                    .then(() =>
                        interaction.editReply({
                            embeds: [
                                new Embed({
                                    author: {
                                        name: interaction.user.username,
                                        icon_url: interaction.user.avatarURL()
                                    },
                                    title: "Επιτυχής Δημιουργία Καθηγητ@",

                                }).addFields(...Object.entries(teacher)
                                    .filter(([key, value]) => !!value)
                                    .map(([key, value]) => ({ name: key, value }))
                                )
                            ]
                        })
                    )
                    .catch(err => interaction.editReply(err.toString()))
            }
            case deleteLiteral: {
                const username = interaction.options.getString(usernameLiteral, true);
                return deleteTeacher(username)
                    .then(() => interaction.editReply(`επιτυχής διαγραφή καθηγητ@ με username:\`${username}\`. Διαγράφηκαν αυτόματα όλες οι συσχετίσεις με μαθήματα`))
                    .catch((err) => interaction.editReply(err.toString()));
            }

            case listLiteral: {
                const text = JSON.stringify(await fetchTeachers(), null, "\t");
                const buffer = Buffer.from(text);
                const file = new MessageAttachment(buffer, new Date().toISOString() + "_Teachers.json");
                return interaction.editReply({
                    files: [file]
                });
            }
        }
    }
    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        return message.reply(`Παρακαλώ χρησιμοποιείστε Slash Command \`/${this.usage}\``)
    }



}