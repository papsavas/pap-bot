
import { ApplicationCommandData, Collection, CommandInteraction, GuildMember, Message, MessageActionRow, MessageAttachment, MessageButton, MessageEmbed, Snowflake } from "discord.js";
import { GaxiosError } from "googleapis-common";
import moment from "moment";
import { guildMap } from "../../..";
import { guildId } from "../../../../values/KEP/IDs.json";
import { examsPrefix, lecturePrefix } from "../../../../values/KEP/literals.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { KepGuild } from "../../../Handlers/Guilds/Impl/KepGuild";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { fetchCourseEvents } from "../../../Queries/KEP/GSheets";
import { fetchCalendarEvents, insertCalendarEvent } from "../../../tools/Google/Gcalendar";
import { snooze } from "../../../tools/scheduler";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_eventsCmd } from "../Interf/KEP_eventsCmd";

const refreshLiteral = "refresh";
const registerLiteral = "register";
const [urlOption, fieldOption, typeOption] = ["url", "field", "type"];
const lectureLiteral = "lecture";
const examLiteral = "exam";
export class KEP_eventsCmdImpl extends AbstractGuildCommand implements KEP_eventsCmd {

    protected _id: Collection<Snowflake, Snowflake> = new Collection(null);
    protected _keyword = `calendar_events`;
    protected _guide = `Διαχειρίζεται τα events του Google Calendar`;
    protected _usage = `${this.keyword} ${refreshLiteral}} | ${registerLiteral} <${urlOption}> <${fieldOption}>`;
    private constructor() { super() }

    static async init(): Promise<KEP_eventsCmd> {
        const cmd = new KEP_eventsCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    readonly #aliases = this.mergeAliases
        (
            ["event"], this.keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: refreshLiteral,
                    description: `Ανανεώνει τα events`,
                    type: "SUB_COMMAND"
                },
                {
                    name: registerLiteral,
                    description: "Δημιουργεί events από δοσμένο Google Sheet",
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: urlOption,
                            description: "Σύνδεσμος για το Google Sheet",
                            type: "STRING",
                            required: true
                        },
                        {
                            name: fieldOption,
                            description: "Όνομα Φύλλου",
                            type: "STRING",
                            required: true
                        },
                        {
                            name: typeOption,
                            description: "Τύπος Event",
                            type: "STRING",
                            required: true,
                            choices: [
                                { name: lectureLiteral, value: lectureLiteral },
                                { name: examLiteral, value: examLiteral }
                            ]
                        }
                    ]
                }
            ]
        }
    }
    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
        await interaction.deferReply({ ephemeral: true, fetchReply: true });
        const subCommand = interaction.options.getSubcommand(true);
        return this.handleRequest(interaction, subCommand);

    }
    async execute(message: Message, { arg1 }: commandLiteral): Promise<unknown> {
        return message.reply("Παρακαλώ χρησιμοποιείστε Slash Command\n" + this.usage)
    }

    getAliases(): string[] {
        return this.#aliases;
    }

    async handleRequest(interaction: CommandInteraction, subcommand: string) {
        const member = interaction.member instanceof GuildMember ?
            interaction.member : await interaction.guild.members.fetch(interaction.member.user.id);
        if (!member.permissions.has("MANAGE_GUILD"))
            return interaction.editReply({ content: "`MANAGE_GUILD` permissions required" });
        switch (subcommand) {
            case refreshLiteral: {
                return reloadEvents()
                    .then(() => interaction.editReply({ content: "Events reloaded" }));
            }
            case registerLiteral: {
                const url = interaction.options.getString(urlOption, true);
                const field = interaction.options.getString(fieldOption, true);
                const type = interaction.options.getString(typeOption, true) as typeof lectureLiteral | typeof examLiteral;
                const courseEvents = await fetchCourseEvents(field, url);
                const text = JSON.stringify(courseEvents, null, "\t");
                const buffer = Buffer.from(text);
                const file = new MessageAttachment(buffer, new Date().toISOString() + "_CalendarPendingEvents.json");
                const msgRef = await interaction.followUp({
                    content: "Is this format valid?",
                    files: [file],
                    components: [new MessageActionRow({
                        components: [
                            new MessageButton({
                                customId: "yes",
                                label: "Yes",
                                emoji: "✅",
                                style: "SUCCESS"
                            }),
                            new MessageButton({
                                customId: "no",
                                label: "No",
                                emoji: "❌",
                                style: "DANGER"
                            })
                        ]
                    })],
                    fetchReply: true
                });
                const msg = await interaction.channel.messages.fetch(msgRef.id);
                try {
                    const btn = await msg.awaitMessageComponent({
                        filter: (i) =>
                            i.user.id === interaction.user.id && ['yes', 'no'].includes(i.customId),
                        componentType: "BUTTON",
                        time: 60000

                    });

                    if (btn.customId === "no") {
                        return interaction.editReply("Command Cancelled");
                    }
                    await btn.deferUpdate();
                } catch (err) {
                    return interaction.editReply("`" + err.toString() + "`")
                        .then(() => msg.delete());
                }
                return Promise.all(
                    courseEvents.map(async e => {
                        e.recurring = type === lectureLiteral ? { recurrence: "WEEKLY", count: 13 } : undefined;
                        await snooze(1000); //avoid rate exceeding requests
                        return insertCalendarEvent({
                            summary: `${type === "lecture" ? `${lecturePrefix}` : `${examsPrefix}`} ${e.title} ${e.info ? `(${e.info})` : ""}`,
                            description: e.code,
                            start: {
                                dateTime: e.start.toISOString(),
                                timeZone: "Europe/Athens"
                            },
                            end: {
                                dateTime: e.end.toISOString(),
                                timeZone: "Europe/Athens"
                            },
                            location: e.location ?? e.url,
                            colorId: type === lectureLiteral ? "10" : "2",
                            recurrence: e.recurring ?
                                [`RRULE:FREQ=${e.recurring.recurrence};COUNT=${e.recurring.count};BYDAY=${moment(e.start).format("dd").toUpperCase()}`]
                                : undefined

                        })
                    })
                )
                    .then(() => reloadEvents())
                    .then(() => interaction.editReply("Events registered & reloaded ✅"))
                    .catch(err => interaction.followUp({
                        embeds: [new MessageEmbed({
                            title: "Missed event",
                            fields: [{ name: "Name", value: `${(err as GaxiosError).response.data?.summary ?? "unknown"}` }],
                            color: "DARK_RED"
                        })],
                        ephemeral: true
                    }))

            }
            default:
                return Promise.reject("invalid subcommand")
        }
    }
}

async function reloadEvents() {
    const kep = guildMap.get(guildId) as KepGuild;
    kep.events = await fetchCalendarEvents();
}