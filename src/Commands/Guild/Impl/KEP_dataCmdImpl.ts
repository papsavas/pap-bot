import { ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, Collection, Embed, GuildMember, Message, Snowflake, User } from "discord.js";
import { commandLiteral } from "../../../Entities/Generic/command";
import { amType, Student } from "../../../Entities/KEP/Student";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { fetchStudent } from "../../../Queries/KEP/Student";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_dataCmd } from "../Interf/KEP_dataCmd";

export class KEP_dataCmdImpl extends AbstractGuildCommand implements KEP_dataCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `data`;
    readonly guide = `Εμφανίζει λεπτομέρειες για συγκεκριμένο μέλος`;
    readonly usage = `${this.keyword} (am <am> | member <member>)`;

    private constructor() { super() }

    static async init(): Promise<KEP_dataCmd> {
        const cmd = new KEP_dataCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    readonly aliases = this.mergeAliases
        (
            ["data", "d"], this.keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'am',
                    description: "Με βάση τον αριθμό μητρώου",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'am',
                            description: 'Ο αριθμός μητρώου',
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                },
                {
                    name: 'user',
                    description: "Με βάση τον χρήστη",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'user',
                            description: 'Ο χρήστης',
                            type: ApplicationCommandOptionType.User,
                            required: true
                        }
                    ]
                }
            ]
        }
    }

    async interactiveExecute(interaction: ChatInputCommandInteraction): Promise<unknown> {
        await interaction.deferReply({ ephemeral: true });
        const am = interaction.options.getString('am') as amType;
        const user = interaction.options.getUser('user');
        const student = await findStudent(am ?? user);
        const data = student ?
            await fetchStudentData(student, await interaction.guild.members.fetch(student.member_id)) :
            [new Embed({
                title: `Δεν βρέθηκε εγγραφή`,
                fields: [{ name: "Είσοδος:", value: user?.toString() ?? am }]
            })];
        return interaction.editReply({
            embeds: data
        });
    }

    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        return message.reply("Για λόγους ασφαλείας, χρησιμοποιείστε **Slash Command** `/data`")
    }



}

const findStudent = (id: amType | User) =>
    id instanceof User ? fetchStudent({ "member_id": (id as User).id }) : fetchStudent({ "am": id as amType });


async function fetchStudentData(student: Student, member: GuildMember): Promise<Embed[]> {
    return [
        new Embed({
            author: {
                name: member.user.username,
                iconURL: member.user.avatarURL()
            },
            fields: [
                {
                    name: 'Member', value: `<@${member.id}>`,
                },
                {
                    name: 'Αριθμός Μητρώου', value: student.am,
                }
            ]
        })
    ]

}