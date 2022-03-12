import { ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, Collection, Message, Snowflake } from "discord.js";
import moment from "moment-timezone";
import 'moment/locale/el';
import { drive as driveLink } from "../../../../values/KEP/info.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { dropDrivePermission, fetchDrivePermissions, findDrivePerm, saveDrivePermission } from "../../../Queries/KEP/Drive";
import { fetchStudent } from "../../../Queries/KEP/Student";
import { addDrivePermission, deleteDrivePermission } from "../../../tools/Google/Gdrive";
import { scheduleTask } from "../../../tools/scheduler";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_driveCmd } from "../Interf/KEP_driveCmd";
moment.locale('el');
moment.tz("Europe/Athens")

const defaultHours: number = 3;
const registerLiteral = "register";
const enabledHours = [3, 6, 12];

export class KEP_driveCmdImpl extends AbstractGuildCommand implements KEP_driveCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `drive`;
    readonly guide = `Λειτουργίες που αφορούν το dai archive`;
    readonly usage = `${this.keyword} register`;
    private constructor() { super() }
    static async init(): Promise<KEP_driveCmd> {
        const cmd = new KEP_driveCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    readonly aliases = this.mergeAliases
        (
            ["drive", "gdrive"], this.keyword
        );
    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
            options: [{
                name: registerLiteral,
                description: `Enables Dai Archive for ${defaultHours} hours`,
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "duration",
                        description: `Διάρκεια Πρόσβασης σε ώρες (default: ${defaultHours} ώρες)`,
                        type: ApplicationCommandOptionType.Integer,
                        choices: [3, 6, 12].map(i => ({ name: `${i} ώρες`, value: i })),
                        required: false
                    }
                ]

            }]
        }
    }
    async interactiveExecute(interaction: ChatInputCommandInteraction): Promise<unknown> {
        await interaction.deferReply({ ephemeral: true });
        const subCommand = interaction.options.getSubcommand();
        const inputHours = interaction.options.getInteger("duration");
        switch (subCommand) {
            case registerLiteral: {
                const existingPermission = await findDrivePerm(interaction.user.id)
                if (!!existingPermission)
                    return interaction.editReply(`Έχετε ήδη ενεργοποιημένη πρόσβαση μέχρι **${moment(existingPermission.destroyedAt).tz("Europe/Athens").format("DD/MM dddd, kk:mm")}**\nΟ σύνδεσμος: ${driveLink}`)
                const duration = inputHours ?? defaultHours;
                const student = await fetchStudent({ member_id: interaction.user.id });
                if (!student)
                    return interaction.editReply('Δεν είστε εγγεγραμμένος. Εγγραφείτε με **`/registration register`**');
                const time = moment().tz("Europe/Athens").add(duration, "hours");
                const perm = await addDrivePermission(student.email);
                await saveDrivePermission(perm.data.id, time, interaction.user.id);
                scheduleTask(time, async () => {
                    if (!!await fetchDrivePermissions(interaction.user.id)[0]) //check if record still exists
                        deleteDrivePermission(perm.data.id)
                            .then(() => dropDrivePermission(perm.data.id))
                });
                return interaction.editReply(`Ενεργοποιήθηκε η πρόσβαση σας για **${duration} ώρες**\nΟ σύνδεσμος: ${driveLink}`)
            }
        }
    }
    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        return message.reply("Παρακαλώ χρησιμοποιείστε Slash Command. Πληκτρολογήστε `/drive` για περισσότερα");
    }




}
