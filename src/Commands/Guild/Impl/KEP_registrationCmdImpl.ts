import { ApplicationCommandData, CommandInteraction, Message, Snowflake } from "discord.js";
import { channels as kepChannels, roles as kepRoles } from "../../../../values/KEP/IDs.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { amType, Student } from "../../../Entities/KEP/Student";
import { guildMap } from "../../../index";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { fetchPendingStudent, fetchStudent, savePendingStudent } from "../../../Queries/KEP/Student";
import { sendEmail } from "../../../tools/Google/Gmail";
import { generateRandomNumber } from "../../../tools/randomNumber";
import { studentEmailregex } from "../../../tools/regexs";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_registrationCmd } from "../Interf/KEP_registrationCmd";

const [registerName, verifyName] = ['register', 'verify'];

export class KEP_registrationCmdImpl extends AbstractGuildCommand implements KEP_registrationCmd {

    protected _id: Snowflake;
    protected _keyword = `registration`;
    protected _guide = `Εγγραφή στην κοινότητα Εφ. Πληροφορικής`;
    protected _usage = `registration register/verify`;
    private constructor() { super() }
    static async init(): Promise<KEP_registrationCmd> {
        const cmd = new KEP_registrationCmdImpl();
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
            options: [
                {
                    name: registerName,
                    description: "σας αποστέλλει με email τον κωδικό επαλήθευσης",
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: "email",
                            description: "το ακαδημαϊκό σας email",
                            type: "STRING",
                            required: true,
                        }
                    ]
                },
                {
                    name: verifyName,
                    description: "επαληθεύει το κωδικό αποστολής σας",
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: "password",
                            description: "ο κωδικός επαλήθευσής σας",
                            type: "NUMBER",
                            required: true,
                        }
                    ]
                }
            ]
        }
    }
    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
        const cmdOptions = interaction.options.get(registerName).options;
        if (Boolean(await fetchStudent({ member_id: interaction.user.id })))
            return interaction.reply({
                content: `Έχετε ήδη εγγραφεί. Σας έχει δωθεί ο ρόλος <@&${kepRoles.student}>`,
                ephemeral: true,
                allowedMentions: { parse: [] }
            })
        await interaction.deferReply({ ephemeral: true });
        switch (interaction.options.getSubcommand(true)) {
            case registerName: {
                const submittedEmail = cmdOptions[0].value as string;
                const email = submittedEmail.match(studentEmailregex);
                if (!email)
                    return interaction.editReply(`Το email που καταχωρήσατε δεν είναι ακαδημαϊκό`);
                const pswd = Math.floor(generateRandomNumber(1111111111, 9999999999));
                await savePendingStudent({
                    am: email.join().split('@')[0] as amType,
                    email: email[0] as Student["email"],
                    member_id: interaction.user.id,
                    password: pswd
                })
                await interaction.editReply(`Θα σας αποσταλεί ένας 10ψήφιος κωδικός στο **${email[0]}**\n__Καταχωρήστε αυτόν τον κωδικό στην εντολή \`verify\` \`(/registration verify)\`__`);
                await sendEmail(email[0], "Verification Password", `Καταχωρήστε τον παρακάτω κωδικό χρησιμοποιώντας την εντολή /registration verify\n
${pswd}\n
Αγνοείστε αυτό το μήνυμα εάν δεν προσπαθήσατε να εγγραφείτε στον Discord Server της Κοινότητα Εφαρμοσμένης Πληροφορικής`)
                await interaction.followUp({
                    content: `Το email έχει αποσταλεί 👌\nΠροχωρήστε με την επαλήθευση του 10ψήφιου κωδικού που αναγράφεται στο email`,
                    ephemeral: true
                });
                break;
            }

            case verifyName: {
                const submittedPswd = cmdOptions[0].value as number;
                await interaction.deferReply({ ephemeral: true });
                const pendingStudent = await fetchPendingStudent(interaction.user.id);
                if (!pendingStudent) //no record of registration
                    return interaction.editReply(`Δεν έχει προηγηθεί κάποια εγγραφή. Παρακαλώ ξεκινήστε χρησιμοποιώντας το \`/registration register\``);
                if (pendingStudent.password === submittedPswd) {
                    await interaction.editReply(`Επιτυχής εγγραφή!`);
                    const member = interaction.guild.members.cache.get(interaction.user.id);
                    await member.roles.add(interaction.guild.roles.cache.get(kepRoles.student));
                    await member.user.send(`Καλώς ήρθες και επισήμως!\nΔιάβασε το <#${kepChannels.readme}> και τους κανόνες <#${kepChannels.rules}> ώστε να προσανατολιστείς`)
                        .catch()
                }
                else {
                    await interaction.editReply(`Λανθασμένος κωδικός. Σιγουρευτείτε ότι αντιγράψατε σωστά τον δεκαψήφιο κωδικό που σας απεστάλη στο ακαδημαϊκό σας email`);
                }
                break;
            }

            default:
                return new Error(`returned wrong subcommand on KEP_registration: ${interaction.options[0].name} `);

        }
    }

    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        return message.reply(`Παρακαλώ χρησιμοποιείστε **slash command** πατώντας \`/\` στο κανάλι <#${kepChannels.registration}> και επιλέγοντας \`/registration register\``);
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}