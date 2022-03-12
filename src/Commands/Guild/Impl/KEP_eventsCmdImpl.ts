
import { ActionRow, ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, ButtonComponent, ButtonStyle, ChatInputCommandInteraction, Collection, Colors, ComponentType, Embed, GuildMember, Message, MessageAttachment, PermissionFlagsBits, Snowflake } from "discord.js";
import { GaxiosError } from "googleapis-common";
import moment from "moment";
import { guilds } from "../../..";
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

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `calendar_events`;
    readonly guide = `Διαχειρίζεται τα events του Google Calendar`;
    readonly usage = `${this.keyword} ${refreshLiteral}} | ${registerLiteral} <${urlOption}> <${fieldOption}>`;
    private constructor() { super() }

    static async init(): Promise<KEP_eventsCmd> {
        const cmd = new KEP_eventsCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    readonly aliases = this.mergeAliases
        (
            ["event"], this.keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: refreshLiteral,
                    description: `Ανανεώνει τα events`,
                    type: ApplicationCommandOptionType.Subcommand
                },
                {
                    name: registerLiteral,
                    description: "Δημιουργεί events από δοσμένο Google Sheet",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: urlOption,
                            description: "Σύνδεσμος για το Google Sheet",
                            type: ApplicationCommandOptionType.String,
                            required: true
                        },
                        {
                            name: fieldOption,
                            description: "Όνομα Φύλλου",
                            type: ApplicationCommandOptionType.String,
                            required: true
                        },
                        {
                            name: typeOption,
                            description: "Τύπος Event",
                            type: ApplicationCommandOptionType.String,
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
    async interactiveExecute(interaction: ChatInputCommandInteraction): Promise<unknown> {
        await interaction.deferReply({ ephemeral: true, fetchReply: true });
        const subCommand = interaction.options.getSubcommand(true);
        return this.handleRequest(interaction, subCommand);

    }
    async execute(message: Message, { arg1 }: commandLiteral): Promise<unknown> {
        return message.reply("Παρακαλώ χρησιμοποιείστε Slash Command\n" + this.usage)
    }



    async handleRequest(interaction: ChatInputCommandInteraction, subcommand: string) {
        const member = interaction.member instanceof GuildMember ?
            interaction.member : await interaction.guild.members.fetch(interaction.member.user.id);
        if (!member.permissions.has(PermissionFlagsBits.ManageGuild))
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
                await interaction.editReply({
                    content: "Is this format valid?",
                    files: [file],
                    components: [new ActionRow({
                        components: [
                            new ButtonComponent({
                                customId: "yes",
                                label: "Yes",
                                emoji: { name: "✅" },
                                style: ButtonStyle.Success
                            }),
                            new ButtonComponent({
                                customId: "no",
                                label: "No",
                                emoji: { name: "❌" },
                                style: ButtonStyle.Danger
                            })
                        ]
                    })]
                });

                try {
                    const btn = await interaction.channel.awaitMessageComponent({
                        filter: (i) =>
                            i.user.id === interaction.user.id && ['yes', 'no'].includes(i.customId),
                        componentType: ComponentType.Button,
                        time: 60000

                    });

                    if (btn.customId === "no") {
                        return interaction.editReply({
                            content: "Command Cancelled",
                            components: [],
                            files: [],
                            attachments: []
                        });
                    }

                    if (btn.customId === "yes")
                        await interaction.editReply({
                            content: `Registering ${courseEvents.length} events ⏳`,
                            components: [],
                            files: [],
                            attachments: []
                        });

                } catch (err) {
                    return interaction.editReply("`" + err.toString() + "`")
                }
                await Promise.all(
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
                    .catch(err => interaction.followUp({
                        embeds: [new Embed({
                            title: "Missed event",
                            description: err.response?.data.summary ? undefined : err.toString(),
                            fields: [{ name: "Name", value: `${(err as GaxiosError).response.data?.summary ?? "-"}` }],
                            color: Colors.DarkRed
                        })],
                        ephemeral: true
                    }))

                return reloadEvents()
                    .then(() => interaction.followUp("Events registered & reloaded in cache ✅"))

            }
            default:
                return Promise.reject("invalid subcommand")
        }
    }
}

async function reloadEvents() {
    const kep = guilds.get(guildId) as KepGuild;
    kep.events = await fetchCalendarEvents();
}