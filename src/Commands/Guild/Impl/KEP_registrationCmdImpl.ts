import { ActionRow, ApplicationCommandOptionType, ApplicationCommandType, ButtonComponent, ButtonStyle, ChatInputApplicationCommandData, ChatInputCommandInteraction, Collection, Colors, CommandInteraction, Embed, Message, Snowflake, TextChannel } from "discord.js";
import { channels as kepChannels, roles as kepRoles } from "../../../../values/KEP/IDs.json";
import { buttons, messages } from "../../../../values/KEP/literals.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { Course } from "../../../Entities/KEP/Course";
import { amType, Student } from "../../../Entities/KEP/Student";
import { KepGuild } from "../../../Handlers/Guilds/Impl/KepGuild";
import { guilds } from "../../../index";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { addStudents, dropPendingStudent, fetchPendingStudent, fetchStudent, savePendingStudent } from "../../../Queries/KEP/Student";
import { sendEmail } from "../../../tools/Google/Gmail";
import { generateRandomNumber } from "../../../tools/randomNumber";
import { studentEmailregex } from "../../../tools/regexs";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_registrationCmd } from "../Interf/KEP_registrationCmd";
const [registerName, verifyName] = ['register', 'verify'];
const [email, password] = ['email', 'password']

export class KEP_registrationCmdImpl extends AbstractGuildCommand implements KEP_registrationCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `registration`;
    readonly guide = `Εγγραφή στην κοινότητα Εφ. Πληροφορικής`;
    readonly usage = `${this.keyword} register/verify`;
    private constructor() { super() }
    static async init(): Promise<KEP_registrationCmd> {
        const cmd = new KEP_registrationCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    readonly aliases = this.mergeAliases
        (
            [], this.keyword,
        );

    //TODO: make this ModalInteraction    
    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: registerName,
                    description: "σας αποστέλλει με email τον κωδικό επαλήθευσης",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: email,
                            description: "το ακαδημαϊκό σας email",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        }
                    ]
                },
                {
                    name: verifyName,
                    description: "επαληθεύει το κωδικό αποστολής σας",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: password,
                            description: "ο κωδικός επαλήθευσής σας",
                            type: ApplicationCommandOptionType.Integer,
                            required: true,
                        }
                    ]
                }
            ]
        }
    }
    async interactiveExecute(interaction: ChatInputCommandInteraction): Promise<unknown> {
        const registeredMember = await fetchStudent({ member_id: interaction.user.id });
        if (registeredMember?.blocked) {
            const member = await interaction.guild.members.fetch(interaction.user.id);
            await interaction.reply({
                content: `Έχετε αποκλειστεί`,
                ephemeral: true
            });
            await (guilds.get(interaction.guildId) as KepGuild).logsChannel.send({
                embeds: [{
                    author: {
                        name: interaction.user.username,
                        iconURL: interaction.user.avatarURL()
                    },
                    title: "Απόπειρα εγγραφής αποκλεισμένου χρήστη",
                    color: Colors.DarkRed,
                    timestamp: new Date().toISOString(),
                    fields: [
                        { name: "Αριθμός μητρωου", value: registeredMember.am },
                        { name: "ID Προηγούμενου Λογαριασμού", value: registeredMember.member_id },
                        { name: "Τωρινός Λογαριασμός", value: member?.toString() },
                    ]
                }]
            })
        }
        if (registeredMember)
            return interaction.reply({
                content: `Έχετε ήδη εγγραφεί. Σας έχει δωθεί ο ρόλος <@&${kepRoles.student}>`,
                ephemeral: true,
                allowedMentions: { parse: [] }
            })
        await interaction.deferReply({ ephemeral: true });
        switch (interaction.options.getSubcommand(true)) {
            case registerName: {
                const submittedEmail = interaction.options.getString(email);
                const emailMatch = submittedEmail.match(studentEmailregex) as Student['email'][];
                if (!emailMatch)
                    return interaction.editReply(`Το \`${submittedEmail}\` δεν είναι ακαδημαϊκό email προπτυχιακών σπουδών`);
                const academicEmail = emailMatch[0];
                const existingStudent = await fetchStudent({ "email": academicEmail });
                if (existingStudent)
                    return conflict(interaction, academicEmail.split('@')[0]);
                if (!!await fetchPendingStudent(interaction.user.id))
                    return interaction.editReply(`Έχετε ήδη λάβει κωδικό. Παρακαλώ χρησιμοποιείστε τον στο \`/registration verify\``);
                const pswd = Math.floor(generateRandomNumber(111111111, 999999999));
                await savePendingStudent({
                    am: academicEmail.split('@')[0] as amType,
                    email: academicEmail,
                    member_id: interaction.user.id,
                    password: pswd
                })
                await interaction.editReply(`Θα σας αποσταλεί ένας ${pswd.toString().length}ψήφιος κωδικός στο **${academicEmail}**`);
                await sendEmail({
                    from: "Κοινότητα Εφαρμοσμένης Πληροφορικής",
                    to: academicEmail as string,
                    subject: "Verification Password",
                    message: `Καταχωρήστε τον παρακάτω κωδικό χρησιμοποιώντας την εντολή /registration ${verifyName}\n
${pswd}\n
Αγνοείστε αυτό το μήνυμα εάν δεν προσπαθήσατε να εγγραφείτε στον Discord Server της Κοινότητα Εφαρμοσμένης Πληροφορικής`
                });
                await interaction.followUp({
                    content: `Το email έχει αποσταλεί 📨\n__Καταχωρήστε τον κωδικό (ως αριθμό) στην εντολή **\`${verifyName}\`**__ \`(/registration ${verifyName})\``,
                    ephemeral: true
                });
                break;
            }

            case verifyName: {
                const submittedPswd = interaction.options.getInteger(password);
                const pendingStudent = await fetchPendingStudent(interaction.user.id);
                if (!pendingStudent) //no record of registration
                    return interaction.editReply(`Δεν έχει προηγηθεί κάποια εγγραφή. Παρακαλώ ξεκινήστε χρησιμοποιώντας το \`/registration register\``);
                if (pendingStudent.password == submittedPswd) {
                    const member = interaction.guild.members.cache.get(interaction.user.id);
                    await addStudents([
                        {
                            am: pendingStudent.am,
                            email: pendingStudent.email,
                            member_id: interaction.user.id,
                        }
                    ])
                    await dropPendingStudent(interaction.user.id);
                    const student = await fetchStudent({ member_id: interaction.user.id });
                    student.courses = new Collection<Snowflake, Course>();
                    await member.roles.add(interaction.guild.roles.cache.get(kepRoles.student));
                    const channel = guilds.get(interaction.guild.id)?.guild.channels.cache.get(kepChannels.new_members) as TextChannel;
                    await channel.send(`<@${pendingStudent.member_id}> **:** ${pendingStudent.am}`);

                    const students = (guilds.get(interaction.guild.id) as KepGuild).students;
                    //TODO: fix duplicate db query, return entire record on submit
                    students.set(interaction.user.id, student); //update cache
                    await interaction.editReply(`Επιτυχής εγγραφή ✅
Καλώς ήρθες και επισήμως!
Διάβασε το <#${kepChannels.readme}> και τους <#${kepChannels.rules}> ώστε να προσανατολιστείς`);
                }
                else {
                    await interaction.editReply(`Λανθασμένος κωδικός. Σιγουρευτείτε ότι αντιγράψατε σωστά τον δεκαψήφιο κωδικό που σας απεστάλη στο ακαδημαϊκό σας email`);
                }
                break;
            }

            default:
                return new Error(`returned wrong subcommand on KEP_registration: ${interaction.options[0].name}`);

        }
    }

    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        return message.reply(`Παρακαλώ χρησιμοποιείστε **slash command** πατώντας \`/\` στο κανάλι <#${kepChannels.registration}> και επιλέγοντας \`/registration register\``);
    }




}

async function conflict(interaction: CommandInteraction, am: string): Promise<unknown> {
    const appealBtn = new ButtonComponent({
        customId: `${buttons.appealId}_${am}_${interaction.user.id}`,
        style: ButtonStyle.Primary,
        label: buttons.appealLabel
    })
    return interaction.editReply({
        embeds: [
            new Embed({
                author: {
                    name: "Εγγεγραμμένο email",
                    iconURL: "https://cdn1.vectorstock.com/i/1000x1000/80/30/conflict-resolution-icon-symbol-isolated-on-white-vector-31728030.jpg"
                },
                title: am,
                description: messages.appeal,
                color: Colors.Red,
                timestamp: new Date()
            })
        ],
        components: [new ActionRow().addComponents(appealBtn)]
    })
}