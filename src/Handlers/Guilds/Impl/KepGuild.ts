import { ActionRow, ButtonComponent, ButtonInteraction, Client, Collection, Embed, Guild, GuildBan, GuildChannel, GuildChannelManager, GuildMember, Message, MessageReaction, SelectMenuInteraction, Snowflake, TextChannel, User } from 'discord.js';
import { calendar_v3 } from 'googleapis';
import { sanitizeDiacritics, toGreek } from "greek-utils";
import moment from "moment-timezone";
import 'moment/locale/el';
import urlRegex from 'url-regex';
import { inDevelopment } from '../../..';
import { categories, channels, roles } from "../../../../values/KEP/IDs.json";
import { buttons, examsPrefix } from "../../../../values/KEP/literals.json";
import { channels as WOAPchannels } from "../../../../values/WOAP/IDs.json";
import { KEP_adminCmdImpl } from '../../../Commands/Guild/Impl/KEP_adminCmdImpl';
import { KEP_courseCmdImpl } from '../../../Commands/Guild/Impl/KEP_courseCmdImpl';
import { KEP_courseTeacherCmdImpl } from '../../../Commands/Guild/Impl/KEP_courseTeacherCmdImpl';
import { KEP_dataCmdImpl } from '../../../Commands/Guild/Impl/KEP_dataCmdImpl';
import { KEP_driveCmdImpl } from '../../../Commands/Guild/Impl/KEP_driveCmdImpl';
import { KEP_eventsCmdImpl } from '../../../Commands/Guild/Impl/KEP_eventsCmdImpl';
import { KEP_infoCmdImpl } from '../../../Commands/Guild/Impl/KEP_infoCmdImpl';
import { KEP_muteCmdImpl } from '../../../Commands/Guild/Impl/KEP_muteCmdImpl';
import { KEP_myScheduleCmdImpl } from '../../../Commands/Guild/Impl/KEP_myScheduleCmdImpl';
import { KEP_registrationCmdImpl } from '../../../Commands/Guild/Impl/KEP_registrationCmdImpl';
import { KEP_surveillanceCmdImpl } from '../../../Commands/Guild/Impl/KEP_surveillanceCmdImpl';
import { KEP_teacherCmdImpl } from '../../../Commands/Guild/Impl/KEP_teacherCmdImpl';
import { GuildCommandManagerImpl } from '../../../Commands/Managers/Impl/GuildCommandManagerImpl';
import { Course } from '../../../Entities/KEP/Course';
import { Student } from '../../../Entities/KEP/Student';
import { Teacher } from '../../../Entities/KEP/Teacher';
import { fetchCourses, fetchTeacherCourses } from '../../../Queries/KEP/Course';
import { dropDrivePermission, fetchDrivePermissions } from '../../../Queries/KEP/Drive';
import { fetchKeywords } from '../../../Queries/KEP/Keywords';
import { dropMutedMember, fetchMutedMembers, findMutedMember } from '../../../Queries/KEP/Member';
import { banStudent, dropAllPendingStudents, dropStudents, fetchStudents, unbanStudent } from '../../../Queries/KEP/Student';
import { fetchTeachers } from '../../../Queries/KEP/Teacher';
import { textSimilarity } from '../../../tools/cmptxt';
import { fetchCalendarEvents } from '../../../tools/Google/Gcalendar';
import { deleteDrivePermission } from '../../../tools/Google/Gdrive';
import { scheduleTask } from '../../../tools/scheduler';
import { AbstractGuild } from "../AbstractGuild";
import { GenericGuild } from "../GenericGuild";
moment.tz("Europe/Athens");


const guildCommands = [
    KEP_registrationCmdImpl,
    KEP_adminCmdImpl,
    //KEP_myExamsCmdImpl,
    KEP_myScheduleCmdImpl,
    KEP_infoCmdImpl,
    KEP_driveCmdImpl,
    KEP_dataCmdImpl,
    KEP_muteCmdImpl,
    KEP_courseCmdImpl,
    KEP_courseTeacherCmdImpl,
    KEP_teacherCmdImpl,
    KEP_eventsCmdImpl,
    KEP_surveillanceCmdImpl
]


export class KepGuild extends AbstractGuild implements GenericGuild {
    public events: calendar_v3.Schema$Event[];
    public teachers: Collection<Teacher['username'], Teacher>;
    public students: Collection<Snowflake, Student>;
    public courses: Course[];
    #keywords: string[];
    public logsChannel: TextChannel;
    #contentScanChannel: TextChannel;
    private constructor(id: Snowflake) {
        super(id);
    }

    static async init(guild_id: Snowflake): Promise<KepGuild> {
        const guild = new KepGuild(guild_id);
        guild.specifiedCommands = guildCommands.map(cmd => cmd.init());
        guild.commandManager = new GuildCommandManagerImpl(
            guild_id,
            await Promise.all(
                guild._genericCommands
                    .concat(guild.specifiedCommands ?? [])) //merge specified commands if any

        );
        return guild;
    }

    async onReady(client: Client): Promise<unknown> {
        await super.onReady(client);
        this.events = await fetchCalendarEvents();
        this.#keywords = await fetchKeywords();
        this.teachers = new Collection((await fetchTeachers()).map(t => [t.username, t]));
        const members = await this.guild.members.fetch();
        this.students = await fetchStudents();
        this.courses = await fetchCourses();
        this.logsChannel = await this.guild.channels.fetch(channels.logs) as TextChannel;
        this.#contentScanChannel = await this.guild.channels.fetch(channels.content_scan) as TextChannel;

        //load teachers
        const tc = await fetchTeacherCourses();
        for (const teacher of this.teachers.values()) {
            const courses = tc
                .filter(tc => tc.teacher_id === teacher.uuid)
                .map(tc => {
                    const course = this.courses.find(c => c.uuid === tc.course_id);
                    return course ?
                        [course.role_id, course] as [Course['role_id'], Course] :
                        null
                })
            teacher.courses = new Collection(courses);
        }

        //load students
        for (const student of this.students.values()) {
            const member = members.get(student.member_id);
            if (!member) {
                await dropStudents({ am: student.am }).catch(console.error);
                continue;
            }
            //assign courses
            for (const rId of [...member.roles.cache.keys()]) {
                const sc = this.courses.find(c => c.role_id === rId);
                if (sc)
                    student.courses.set(sc.role_id, sc);
            }
        }
        handleExaminedChannels(this.courses, this.events, this.guild.channels);
        handleActiveDrivePermissions();
        handleMutedMembers(this.guild);
        if (!inDevelopment) await dropAllPendingStudents();
        return Promise.resolve('KEP Loaded');
    }

    async onMessage(message: Message): Promise<unknown> {
        if ([
            categories.etos1, categories.etos2,
            categories.etos3, categories.etos4,
            categories.etos4_2, categories.didaktiki,
            categories.sxolh
        ].includes((message.channel as GuildChannel).parentId))
            scanContent(message, this.#keywords, this.#contentScanChannel);
        switch (message.channel.id) { //channels
            case channels.registration: {
                if (message.deletable) await message.delete();
                await message.member.send({ content: `Παρακαλώ χρησιμοποιείστε **slash command** πατώντας \`/\` στο κανάλι <#${channels.registration}> και επιλέγοντας \`/registration register\`` })
                    .catch();
                break;
            }

            case channels.anonymous_approval:
                if (message.embeds.length > 0) {
                    await message.react('✅');
                    await message.react('❌');
                    await message.react('✝');
                }
                break;

            case channels.memes: {
                if (
                    (
                        message.attachments.size === 0 &&
                        !urlRegex({ strict: true, exact: false })
                            .test(message.content)
                    )
                    && message.deletable
                )
                    await message.delete();
                break;
            }

            case channels.feedback: {
                if (message.type === "DEFAULT") {
                    await message.react('👍');
                    await message.react('👎');
                }
                break;
            }

            case channels.questions: {
                return message.type === "DEFAULT" ?
                    message.startThread({
                        name: message.id,
                        autoArchiveDuration: "MAX",
                        reason: `question asked by ${message.author.tag}`
                    }) :
                    message.deletable ?
                        message.delete() :
                        message.react('🗑')
            }


        }

        switch ((message.channel as GuildChannel).parentId) { //categories
            default:
                break;
        }
        return super.onMessage(message);
    }

    async onMessageDelete(message: Message): Promise<unknown> {
        await super.onMessageDelete(message);
        const logChannel = message.guild.channels.cache.get(channels.logs) as TextChannel;
        return logChannel?.send({
            embeds: [
                new Embed(
                    {
                        author: {
                            name: message.author.username,
                            icon_url: message.author.avatarURL({ format: 'png' })
                        },
                        color: `#ffffff`,
                        description: `**🗑️ Διεγράφη Μήνυμα από ${message.member?.toString() ?? message.author.username} στο ${message.channel.toString()}**
    *Μήνυμα:* "**${message.content}**\nMedia: ${message.attachments.first()?.proxyURL ?? '-'}"`,
                        footer: {
                            text: `sent at: ${moment(message.createdTimestamp).format('LLLL')}`
                        }
                    }
                )
            ]
        })
    }

    async onMessageReactionAdd(reaction: MessageReaction, user: User): Promise<unknown> {
        try {
            switch (reaction.message.channel.id) {

                case channels.anonymous_approval: {
                    const emb = reaction.message.embeds[0];
                    if (Boolean(emb)) {
                        const targetChannel = reaction.message.guild.channels.cache.get(channels.anonymous) as TextChannel;
                        switch (reaction.emoji.name) {
                            case '✅': {
                                const msg = await targetChannel.send({ embeds: [emb] });
                                await msg.startThread({
                                    name: msg.embeds[0].footer.text,
                                    autoArchiveDuration: 1440
                                }).catch(err => console.log(`could not create anonymous thread\n` + err.toString()));
                                await reaction.message.reactions.removeAll();
                                await reaction.message.react('☑');
                                break;
                            }
                            case '❌': {
                                await reaction.message.reactions.removeAll();
                                reaction.message.react('✂');
                                break;
                            }
                            case '✝': {
                                await reaction.message.reactions.removeAll();
                                reaction.message.react('✂');
                                const channel = reaction.message.guild.channels.cache.get(WOAPchannels.cemetery);
                                await (channel as TextChannel).send({ embeds: [emb] })
                                break;
                            }
                        }
                    }

                }

                case channels.content_scan: {
                    switch (reaction.emoji.name) {
                        case '🗑': {
                            return reaction.message.deletable ? reaction.message.delete() : null
                        }

                        case '👀': {
                            return reaction.message.reactions.removeAll().catch()
                        }
                    }
                }

                default:
                    return super.onMessageReactionAdd(reaction, user);
            }
        } catch (error) {
            console.log(error);
        }
    }

    async onSelectMenu(select: SelectMenuInteraction) {
        switch (select.channel.id) {

            case channels.select_courses: {
                const member = await select.guild.members.fetch(select.user.id);
                const student = this.students.get(member.id);
                if (!student)
                    return select.reply({
                        content: "Δεν είστε εγγεγραμμένος/η",
                        ephemeral: true
                    })
                const studentCourses = student.courses;
                const codes = select.values;
                const semester = select.customId;
                const semesterCourses = this.courses.filter(c => c.semester == semester)
                const selectedCourses = this.courses.filter(cl => codes.includes(cl.code));
                const semesterRolesIds: Snowflake[] = semesterCourses.map(c => c.role_id);
                const oldSemesterRoles = member.roles.cache.filter(r => semesterRolesIds.includes(r.id));
                await member.roles.remove(semesterRolesIds);
                await member.roles.add(selectedCourses.map(c => c.role_id).filter(r => !member.roles.cache.has(r)));
                //! filtering courses with roles & vice versa might cause name variance
                const newSemesterCourses = selectedCourses.filter(c => !oldSemesterRoles.has(c.role_id));
                const [added, removedRoles] = [
                    newSemesterCourses
                        .map(c => `**• ${c.name}**`)
                        .join('\n'),
                    oldSemesterRoles
                        .filter(r => !selectedCourses.find(c => c.role_id === r.id))
                ]

                studentCourses.sweep(sc => removedRoles.has(sc.role_id));
                for (const course of newSemesterCourses)
                    studentCourses.set(course.role_id, course);

                const header = {
                    author: {
                        name: member.displayName,
                        icon_url: member.user.avatarURL()
                    },
                    title: `${semester}ο Εξάμηνο`
                }
                const logEmbeds: Embed[] = [];
                if (added.length > 0) logEmbeds.push(
                    new Embed(header)
                        .setColor("BLUE")
                        .addFields([{ name: 'Προστέθηκαν', value: added }])
                );
                if (removedRoles.size > 0) logEmbeds.push(
                    new Embed(header)
                        .setColor("RED")
                        .addFields([{
                            name: 'Αφαιρέθηκαν', value: removedRoles
                                .map(r => `**• ${r.name}**`)
                                .join('\n')
                        }])
                );

                if (logEmbeds.length === 0)
                    logEmbeds.push(new Embed(header).setDescription("Δεν υπήρξαν αλλαγές"))

                return select.reply({
                    embeds: logEmbeds,
                    ephemeral: true
                });
            }

            default:
                return super.onSelectMenu(select);

        }
    }

    async onButton(interaction: ButtonInteraction) {
        switch (interaction.channel.id) {
            case channels.registration: {
                if (interaction.customId.startsWith(buttons.appealId)) {
                    const [appealLiteral, am, userid] = interaction.customId.split('_');
                    const channelName = `${am}_${userid}`;
                    const existingChannel = (await interaction.guild.channels/*.threads*/.fetch())
                        .find(c => c.name === channelName);
                    if (!!existingChannel)
                        return interaction.reply({
                            content: `Έχει ήδη δημιουργηθεί κανάλι <#${existingChannel.id}>`,
                            ephemeral: true
                        })
                    const appealChannel = /*interaction.channel as TextChannel;*/ await interaction.guild.channels.create(channelName, {
                        type: 'GUILD_TEXT',
                        parent: categories.mod,
                        permissionOverwrites: [
                            {
                                id: interaction.client.user.id,
                                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES', 'EMBED_LINKS'],
                                type: "member"
                            },
                            {
                                id: roles.mod,
                                type: "role",
                                allow: [
                                    "VIEW_CHANNEL",
                                    "SEND_MESSAGES",
                                    "READ_MESSAGE_HISTORY",
                                    "ATTACH_FILES",
                                    "ADD_REACTIONS",
                                    "MANAGE_CHANNELS",
                                    "MANAGE_MESSAGES",
                                ]
                            },
                            {
                                id: userid,
                                type: 'member',
                                allow: [
                                    "ATTACH_FILES",
                                    "VIEW_CHANNEL",
                                    "SEND_MESSAGES",
                                    "READ_MESSAGE_HISTORY"
                                ]
                            },
                            {
                                id: interaction.guildId,
                                type: 'role',
                                deny: ['VIEW_CHANNEL']
                            }
                        ]
                    });

                    const conflictingStudent = this.students.find(s => s.am === am);
                    return appealChannel.send({
                        content: `<@${userid}>`,
                        embeds: [
                            new Embed({
                                title: "Έφεση",
                                description: `<@${userid}> Θα πρέπει να στείλετε εδώ μία φωτογραφία της ακαδημαϊκή σας ταυτότητας με εμφανή τον αριθμό μητρώου`,
                                fields: [{
                                    name: "Συγκρουόμενος Λογαριασμός:",
                                    value: `<@${conflictingStudent.member_id}>`,
                                    inline: true
                                }],
                                timestamp: new Date(),
                                color: "RANDOM"
                            })
                        ],
                        allowedMentions: {
                            roles: [roles.head_mod],
                            users: [userid]
                        }
                    })
                        .then(msg =>
                            interaction.reply({
                                content: `Δημιουργήθηκε ιδιωτικό κανάλι <#${appealChannel.id}>. Παρακαλώ αποστείλετε εκεί την φωτογραφία της ακαδημαϊκής σας ταυτότητας`,
                                ephemeral: true
                            })
                        )
                        .catch(console.error);

                }
            }

            case channels.select_courses: {
                const member = await interaction.guild.members.fetch(interaction.user.id);
                const student = this.students.get(member.id);
                if (!student)
                    return interaction.reply({
                        content: "Δεν είστε εγγεγραμμένος/η",
                        ephemeral: true
                    })
                const studentCourses = student.courses;
                const semester = interaction.customId.split('_')[0];
                const semesterCourses = this.courses.filter(c => c.semester == semester);
                const selectedCourses = semesterCourses.filter(c => member.roles.cache.has(c.role_id));
                await member.roles.remove(selectedCourses.map(c => c.role_id));
                //sweep cache
                studentCourses.sweep((v, k) => selectedCourses.some(sc => sc.role_id === k));
                return interaction.reply({
                    embeds: [
                        new Embed({
                            author: {
                                name: member.displayName,
                                icon_url: member.user.avatarURL()
                            },
                            title: `${semester}ο Εξάμηνο`,
                            color: "RED",
                            fields: [
                                {
                                    name: 'Αφαιρέθηκαν',
                                    value: selectedCourses.length > 0 ?
                                        selectedCourses
                                            .map(r => `**• ${r.name}**`)
                                            .join('\n')
                                        : "Δεν υπήρξαν αλλαγές"
                                }
                            ]
                        })
                    ],
                    ephemeral: true
                });
            }

            case channels.content_scan: {
                await interaction.deferReply({ ephemeral: true })
                const message = await interaction.channel.messages.fetch(interaction.message.id);
                switch (interaction.customId) {

                    case buttons.warnSus: {
                        return interaction.editReply(`Until pop up release, warns are added manually.\n\`~warn <member_id> <reason>\` at <#${channels.skynet}>`)
                    }

                    case buttons.focusSus: {
                        return message.edit({
                            content: `<@&${roles.mod}> **Requires Attention**`,
                            embeds: message.embeds.map(e => e.setColor("RED")),
                            components: [
                                new ActionRow().setComponents(
                                    new ButtonComponent(susWarnBtn), new ButtonComponent(susFocusBtn).setDisabled(), new ButtonComponent(susResolvedBtn), new ButtonComponent(susDeleteBtn).setDisabled(),
                                    //include jump button
                                    message.components[0].components.find(c => !c.customId)
                                ),
                                new ActionRow().setComponents(new ButtonComponent(susSurveillanceBtn))
                            ],
                            allowedMentions: { parse: ["roles"] }
                        })
                            .then(() => interaction.editReply("Marked as focused"))

                    }

                    case buttons.resolvedSus: {
                        return message.edit({
                            content: `*Marked as resolved by ${interaction.member.toString()} at ${moment().tz("Europe/Athens").format("LLLL")}*`,
                            allowedMentions: { parse: [] },
                            embeds: message.embeds.map(e => e.setColor("GREEN").setTitle("Resolved ✅\n" + e.title)),
                            components: message.components
                                .map(ar => ar.setComponents(
                                    ar.components
                                        .map(c => c.customId ? c.setDisabled() : c) //keep link btn enabled
                                ))

                        })
                            .then(() => interaction.editReply("Marked as Resolved"))
                    }

                    case buttons.deleteSus: {
                        return message.delete()
                            .then(() => interaction.editReply("Message Deleted"));
                    }

                    case buttons.surveillanceSus: {
                        const member = await interaction.guild.members.fetch(interaction.user.id);
                        return (member.roles.cache.has(roles.overseer) ?
                            member.roles.remove(roles.overseer) : member.roles.add(roles.overseer))
                            .then(() => interaction.editReply("Surveillance role toggled"))
                    }

                    default:
                        return interaction.editReply(`No listener for button \`${interaction.customId}\``);
                }
            }

            default:
                return super.onButton(interaction);
        }
    }

    async onGuildMemberRemove(member: GuildMember): Promise<unknown> {
        await super.onGuildBanRemove(member);
        this.students.delete(member.id)
        return dropStudents({
            member_id: member.id
        });
    }

    async onGuildBanAdd(ban: GuildBan) {
        await super.onGuildBanAdd(ban);
        const { user } = ban;
        const logs = this.guild.channels.cache.get(channels.logs) as TextChannel;
        logs.send(`Banned **${this.students.get(user.id)?.am}**`);
        return banStudent(user.id);
    }

    async onGuildBanRemove(unban: GuildBan) {
        await super.onGuildBanRemove(unban);
        const { user } = unban;
        const logs = this.guild.channels.cache.get(channels.logs) as TextChannel;
        logs.send(`Unbanned **${this.students.get(user.id)?.am}**`);
        return unbanStudent(user.id);
    }
}

function handleExaminedChannels(
    courses: Course[],
    events: calendar_v3.Schema$Event[],
    channelManager: GuildChannelManager
): void {
    return events
        .filter(ev => ev.summary?.trimStart().startsWith(examsPrefix))
        .forEach(async ev => {
            const course = courses.find(c =>
                c.code.includes(ev.description)
            );
            if (course) {
                const channel = await channelManager.fetch(course.channel_id) as GuildChannel;
                scheduleTask(
                    ev.start.dateTime,
                    () => channel.permissionOverwrites.edit(course.role_id, {
                        SEND_MESSAGES: false
                    })
                ).then(() => scheduleTask(
                    ev.end.dateTime,
                    () => channel.permissionOverwrites.edit(course.role_id, {
                        SEND_MESSAGES: true
                    })
                ));
            }
        });
}

function handleActiveDrivePermissions() {
    fetchDrivePermissions()
        .then(async perms => {
            for (const p of perms) {
                if (p.destroyedAt.getTime() < new Date().getTime()) {
                    await deleteDrivePermission(p.perm_id).catch(console.error);
                    await dropDrivePermission(p.perm_id);
                    continue;
                }
                scheduleTask(moment(p.destroyedAt), async () => {
                    await deleteDrivePermission(p.perm_id).catch(console.error);
                    await dropDrivePermission(p.perm_id);

                })
            }
        })
}

async function handleMutedMembers(guild: Guild) {
    for (const mm of await fetchMutedMembers()) {
        scheduleTask(moment(mm.unmuteAt), async () => {
            if (!!await findMutedMember(mm.member_id)) {
                const member = await guild.members.fetch(mm.member_id);
                await member?.roles?.set(mm.roles);
                await dropMutedMember(member.id);
                const headerEmb = new Embed({
                    author: {
                        name: `CyberSocial Excluded`,
                        icon_url: `https://i.imgur.com/92vhTqK.png`
                    },
                    title: `Mute Logs`,
                    color: "DARKER_GREY",
                    footer: { text: `Execution Number: 1662` },
                })
                await (guild.channels.cache.get(channels.logs) as TextChannel).send({
                    embeds: [
                        new Embed(headerEmb)
                            .setDescription(`Unmuted ${member.toString()}`)
                    ]
                })
            }
        })
    }
}

const { warnSus, focusSus, resolvedSus, deleteSus, surveillanceSus } = buttons;

const susWarnBtn = new ButtonComponent({
    customId: warnSus,
    style: "PRIMARY",
    label: "Warn",
    emoji: "⚠"
})
const susFocusBtn = new ButtonComponent({
    customId: focusSus,
    style: "DANGER",
    emoji: "🎯",
    label: "Focus",
});
const susResolvedBtn = new ButtonComponent({
    customId: resolvedSus,
    style: "SUCCESS",
    emoji: "✅",
    label: "Resolved",
})
const susDeleteBtn = new ButtonComponent({
    customId: deleteSus,
    style: "SECONDARY",
    emoji: "🗑",
    label: "Delete"
})

const susJumpBtn = (url: string) => new ButtonComponent({
    style: "LINK",
    url,
    label: "Jump",
})

const susSurveillanceBtn = new ButtonComponent({
    customId: surveillanceSus,
    style: "PRIMARY",
    emoji: "🚨",
    label: "Surveillance"

})

function scanContent({ content, author, member, channel, url, attachments }: Message, keywords: string[], logChannel: TextChannel): void {
    const normalize = (text: string) => sanitizeDiacritics(toGreek(text)).trim();
    const index = normalize(content).split(' ').findIndex(c =>
        keywords.includes(c) ||
        keywords.some(k => c.includes(k)) ||
        keywords.some(k => textSimilarity(c, k) > 0.9)
    );
    const found = index === -1 ? undefined : content.split(' ')[index];
    if (found) {
        logChannel.send({
            embeds: [new Embed({
                author: {
                    name: member.displayName ?? author.username,
                    icon_url: author.avatarURL()
                },
                title: `Keyword Detected: "${found}"`,
                description: `${content.replace(found, `**${found}**`)}`,
                color: "LIGHT_GREY",
                image: { proxyURL: attachments?.first()?.proxyURL },
                fields: [
                    { name: "Channel", value: channel.toString(), inline: false },
                    { name: "Member", value: member.toString(), inline: false },
                    { name: "Member ID", value: member.id, inline: true }
                ],
                timestamp: new Date(),
            })],
            components: [
                new ActionRow().addComponents(
                    [susWarnBtn, susFocusBtn, susResolvedBtn, susDeleteBtn, susJumpBtn(url)]
                        .map(source => new ButtonComponent(source))
                ),
                new ActionRow().addComponents(susSurveillanceBtn)
            ],
        })
            .catch(err => console.log(`Could not message for detected keyword\n${author}: ${content} on ${url}`));
    }
}

