import { ChatInputApplicationCommandData, Collection, CommandInteraction, Constants, EmbedFieldData, Message, MessageEmbed, Snowflake } from "discord.js";
import { calendar_v3 } from "googleapis";
import moment from "moment";
import 'moment/locale/el';
import { guildMap } from "../../..";
import { guildId as kepGuildId } from "../../../../values/KEP/IDs.json";
import { lecturePrefix } from "../../../../values/KEP/literals.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { Course } from "../../../Entities/KEP/Course";
import { KepGuild } from "../../../Handlers/Guilds/Impl/KepGuild";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_myScheduleCmd } from "../Interf/KEP_myScheduleCmd";

moment.locale('el');

const fieldBuilder = ((ev: calendar_v3.Schema$Event, course: Course): EmbedFieldData => ({
    name: `• ${ev.summary ?? "Δεν βρέθηκε όνομα"} (${course?.code ?? "-"})`,
    value: `📌 ${ev.location ?? ''} |  ⌚ ${moment(ev.start.dateTime).tz("Europe/Athens").format("kk:mm")} - ${moment(ev.end.dateTime).tz("Europe/Athens").format("kk:mm")}`,
}));
export class KEP_myScheduleCmdImpl extends AbstractGuildCommand implements KEP_myScheduleCmd {

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `myschedule`;
    protected _guide = `Σας εμφανίζει το εβδομαδιαίο σας πρόγραμμα`;
    protected _usage = `myschedule`;
    private constructor() { super() }
    static async init(): Promise<KEP_myScheduleCmd> {
        const cmd = new KEP_myScheduleCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    private readonly _aliases = this.addKeywordToAliases
        (
            ["my_schedule", "schedule"], this._keyword
        );

    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
        const resp = generateEmbeds(interaction);
        return interaction.user.send({
            embeds: resp
        })
            .then(() => interaction.reply({
                ephemeral: true,
                content: "Απεστάλη με DM"
            }))
            .catch(err =>
                err.code === Constants.APIErrors.CANNOT_MESSAGE_USER ?
                    interaction.reply({
                        content: "Έχετε κλειστά DMs",
                        ephemeral: true,
                        embeds: resp
                    })
                    : Promise.reject(err)
            );
    }

    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        return message.author.send({
            embeds: generateEmbeds(message)
        })
            .then(() => message.reply({
                content: "Απεστάλη με DM"
            })).catch(err =>
                err.code === Constants.APIErrors.CANNOT_MESSAGE_USER ?
                    message.reply({
                        content: "Έχετε κλειστά DMs. Δεν θα αποσταλεί σε κοινή θεα. Χρησιμοποιείστε slash command για να το δείτε μόνο εσείς"
                    })
                    : Promise.reject(err)
            );
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}

function generateEmbeds(request: Message | CommandInteraction): MessageEmbed[] {
    const courses = (guildMap.get(kepGuildId) as KepGuild).students.get(request.member.user.id)?.courses;
    const events = (guildMap.get(kepGuildId) as KepGuild).events
        //trim blanks
        .map(ev => ({ ...ev, summary: ev.summary.trim() }))
        //filter lectures
        .filter(ev => ev.summary?.startsWith(lecturePrefix))

    if (!courses || courses.size === 0)
        return [
            new MessageEmbed({ description: "Δεν φαίνεται να έχετε επιλεγμένα μαθήματα με προγραμματισμένες διαλέξεις" })
        ]

    if (events.length === 0)
        return [
            new MessageEmbed({ description: "Δεν υπάρχουν καταχωρημένες ημερομηνίες διαλέξεων" })
        ]

    const studentEvents = events
        .filter(ev => courses
            //match by description (requires course code to be in event description)
            .find(c => c.code.trim().includes(ev.description))
        )

    const uniqueStudentEvents = new Map<string, calendar_v3.Schema$Event>();
    studentEvents.forEach(ev => {
        const key = `${moment(ev.start.dateTime).hour()}|${ev.summary}`;
        if (!uniqueStudentEvents.has(key))
            uniqueStudentEvents.set(key, ev);
    });

    if (uniqueStudentEvents.size === 0)
        return [
            new MessageEmbed()
                .setDescription("Δεν φαίνεται να έχετε επιλεγμένα μαθήματα με προγραμματισμένες διαλέξεις")
        ]

    const embeds = new Map<number, MessageEmbed>();
    [1, 2, 3, 4, 5]
        .map(d => embeds.set(d, new MessageEmbed({
            author: {
                name: moment().day(d).format('dddd'),
                icon_url: "https://icons.iconarchive.com/icons/paomedia/small-n-flat/512/calendar-icon.png"
            }
        })))

    uniqueStudentEvents
        .forEach(ev =>
            embeds.get(moment(ev.start.dateTime).day())
                .addFields(fieldBuilder(ev, courses.find(c => c.code.includes(ev.description))))
        )

    return [...embeds.values()];
}