import { ApplicationCommandData, Collection, CommandInteraction, Message, Snowflake } from "discord.js";
import moment from "moment";
import { guildMap } from "../../..";
import { drive as driveLink } from "../../../../values/KEP/info.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { dropDrivePermission, findDrivePerm, saveDrivePermission } from "../../../Queries/KEP/drivePerms";
import { fetchStudent } from "../../../Queries/KEP/Student";
import { addDrivePermission, deleteDrivePermission } from "../../../tools/Google/Gdrive";
import { scheduleTask } from "../../../tools/scheduler";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_driveCmd } from "../Interf/KEP_driveCmd";

const defaultHours: number = 3;
const registerLiteral = "register";
const enabledHours = [3, 6, 12];

export class KEP_driveCmdImpl extends AbstractGuildCommand implements KEP_driveCmd {

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `drive`;
    protected _guide = `Λειτουργίες που αφορούν το dai archive`;
    protected _usage = `drive register`;
    private constructor() { super() }
    static async init(): Promise<KEP_driveCmd> {
        const cmd = new KEP_driveCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    private readonly _aliases = this.addKeywordToAliases
        (
            ["drive", "gdrive"], this.keyword
        );
    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [{
                name: registerLiteral,
                description: `Enables Dai Archive for ${defaultHours} hours`,
                type: "SUB_COMMAND",
                options: [
                    {
                        name: "duration",
                        description: `Διάρκεια Πρόσβασης σε ώρες (default: ${defaultHours})`,
                        type: "INTEGER",
                        choices: [3, 6, 12].map(i => ({ name: `${i}`, value: i })),
                        required: false
                    }
                ]

            }]
        }
    }
    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
        await interaction.deferReply({ ephemeral: true });
        const subCommand = interaction.options.getSubcommand();
        const [durationHours] = enabledHours.map(i => interaction.options.getInteger(`${i}`)).filter(v => !!v);
        console.log(`time is ${durationHours} hours`);
        switch (subCommand) {
            case registerLiteral: {
                const existingPermission = await findDrivePerm(interaction.user.id)
                if (!!existingPermission)
                    return interaction.editReply(`Έχετε ήδη ενεργοποιημένη πρόσβαση μέχρι ${moment(existingPermission.destroyedAt).format("hh:mm:ss a")}`)
                const duration = durationHours ?? defaultHours;
                const student = await fetchStudent({ member_id: interaction.user.id });
                const perm = await addDrivePermission(student.email);
                const time = moment().add(duration, "hours");
                await saveDrivePermission(perm.data.id, time, interaction.user.id);
                scheduleTask(time, () =>
                    deleteDrivePermission(perm.data.id)
                        .then(() => dropDrivePermission(perm.data.id))
                );
                return interaction.editReply(`Ενεργοποιήθηκε η πρόσβαση σας για **${duration} ώρες**\nΟ σύνδεσμος: ${driveLink}`)
            }
        }
    }
    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        return message.reply("Παρακαλώ χρησιμοποιείστε Slash Command. Πληκτρολογήστε `/drive` για περισσότερα");
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}
