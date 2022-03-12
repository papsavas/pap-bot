import { ApplicationCommandType, ChatInputApplicationCommandData, Collection, CommandInteraction, Embed, EmbedFieldData, Message, RESTJSONErrorCodes, Snowflake } from "discord.js";
import { calendar_v3 } from "googleapis";
import moment from "moment";
import 'moment/locale/el';
import { guilds } from "../../..";
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
    name: `• ${ev.summary.slice(lecturePrefix.length).trimStart() ?? "Δεν βρέθηκε όνομα"} (${course?.code ?? "Δεν βρέθηκε κωδικός"})`,
    value: `📌 ${ev.location ?? ''}  |  ⌚ ${moment(ev.start.dateTime).tz("Europe/Athens").format("kk:mm")} - ${moment(ev.end.dateTime).tz("Europe/Athens").format("kk:mm")}`,
}));
export class KEP_myScheduleCmdImpl extends AbstractGuildCommand implements KEP_myScheduleCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `myschedule`;
    readonly guide = `Σας εμφανίζει το εβδομαδιαίο σας πρόγραμμα`;
    readonly usage = `${this.keyword}`;
    private constructor() { super() }
    static async init(): Promise<KEP_myScheduleCmd> {
        const cmd = new KEP_myScheduleCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    readonly aliases = this.mergeAliases
        (
            ["my_schedule", "schedule"], this.keyword
        );

    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
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
                err.code === RESTJSONErrorCodes.CannotSendMessagesToThisUser ?
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
                err.code === RESTJSONErrorCodes.CannotSendMessagesToThisUser ?
                    message.reply({
                        content: "Έχετε κλειστά DMs. Δεν θα αποσταλεί σε κοινή θεα. Χρησιμοποιείστε slash command για να το δείτε μόνο εσείς"
                    })
                    : Promise.reject(err)
            );
    }




}

function generateEmbeds(request: Message | CommandInteraction): Embed[] {
    const courses = (guilds.get(kepGuildId) as KepGuild).students.get(request.member.user.id)?.courses;
    const events = (guilds.get(kepGuildId) as KepGuild).events
        //trim blanks
        .map(ev => ({ ...ev, summary: ev?.summary?.trim(), description: ev?.description?.trim() }))
        //filter lectures
        .filter(ev => ev.summary?.startsWith(lecturePrefix))

    if (!courses || courses.size === 0)
        return [
            new Embed({ description: "Δεν φαίνεται να έχετε επιλεγμένα μαθήματα με προγραμματισμένες διαλέξεις" })
        ]

    if (events.length === 0)
        return [
            new Embed({ description: "Δεν υπάρχουν καταχωρημένες ημερομηνίες διαλέξεων" })
        ]

    //filter events by student's selected courses
    const studentEvents = events
        .filter(ev => courses
            //match by description (requires course code to be in event description)
            .find(c => c.code.trim().includes(ev.description))
        )

    const uniqueStudentEvents = new Map<string, calendar_v3.Schema$Event>();
    studentEvents.forEach(ev => {
        const key = ev.recurringEventId ?? `${ev.summary}${moment.utc(ev.start.dateTime).hour()}`.trim();
        if (!uniqueStudentEvents.has(key))
            uniqueStudentEvents.set(key, ev);
    });

    if (uniqueStudentEvents.size === 0)
        return [
            new Embed()
                .setDescription("Δεν φαίνεται να έχετε επιλεγμένα μαθήματα με προγραμματισμένες διαλέξεις")
        ]

    const embeds = new Map<number, Embed>();
    [1, 2, 3, 4, 5]
        .forEach(d => embeds.set(d, new Embed({
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