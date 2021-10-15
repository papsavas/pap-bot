import { ApplicationCommandData, Collection, CommandInteraction, Message, MessageEmbed, Snowflake } from "discord.js";
import { guildMap } from "../../..";
import { commandLiteral } from "../../../Entities/Generic/command";
import { Teacher } from "../../../Entities/KEP/Teacher";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { deleteTeacher } from "../../../Queries/KEP/Teacher";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_teacherCmd } from "../Interf/KEP_teacherCmd";

const [createLiteral, deleteLiteral] = ["create", "delete"];
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

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `teacher`;
    protected _guide = `Διαχειρίζεται τους καθηγητές στη ΒΔ`;
    protected _usage = `${this.keyword} create <username> <full_name> <phone_number>, [picture_url], [website] | delete <username>`;
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
            type: 'CHAT_INPUT',
            options: [
                {
                    name: createLiteral,
                    description: `Δημιουργεί νέο καθηγητ@`,
                    type: 'SUB_COMMAND',
                    options: [
                        {
                            name: usernameLiteral,
                            description: `Αναγνωριστικό καθηγητ@`,
                            type: 'STRING',
                            required: true
                        },
                        {
                            name: fullNameLiteral,
                            description: `Ονοματεπώνυμο Καθηγητ@`,
                            type: 'STRING',
                            required: true
                        },
                        {
                            name: phoneNumberLiteral,
                            description: `Τηλέφωνο Επικοινωνίας`,
                            type: 'STRING',
                            required: true
                        },
                        {
                            name: pictureUrlLiteral,
                            description: `Link Φωτογραφίας`,
                            type: 'STRING',
                            required: false
                        },
                        {
                            name: websiteLiteral,
                            description: `Προσωπική Ιστοσελίδα`,
                            type: 'STRING',
                            required: false
                        }
                    ]
                },
                {
                    name: deleteLiteral,
                    description: `Διαγραφή Καθηγητ@`,
                    type: 'SUB_COMMAND',
                    options: [
                        {
                            name: usernameLiteral,
                            description: `Αναγνωριστικό Καθηγητ@`,
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
        await interaction.deferReply({ ephemeral: false })
        const subcommand = interaction.options.getSubcommand(true);
        const username = interaction.options.getString(usernameLiteral, true);
        switch (subcommand) {
            case createLiteral: {
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
                return interaction.editReply({
                    embeds: [
                        new MessageEmbed({
                            author: {
                                name: interaction.user.username,
                                icon_url: interaction.user.avatarURL()
                            },
                            title: "Επιτυχής Δημιουργία Καθηγητ@",

                        }).addFields(Object.entries(teacher)
                            .filter(([key, value]) => !!value)
                            .map(([key, value]) => ({ name: key, value })))
                    ]
                })
            }
            case deleteLiteral: {
                return deleteTeacher(username)
                    .then(() => interaction.editReply(`επιτυχής διαγραφή καθηγητ@ με username:\`${username}\`. Διαγράφηκαν αυτόματα όλες οι συσχετίσεις με μαθήματα`))
                    .catch((err) => interaction.editReply(err.toString()));
            }
        }
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