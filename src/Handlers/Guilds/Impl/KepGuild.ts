import { ButtonInteraction, Client, Collection, Guild, GuildBan, GuildChannel, GuildChannelManager, GuildMember, Message, MessageEmbed, MessageReaction, Role, SelectMenuInteraction, Snowflake, TextChannel, User } from 'discord.js';
import { calendar_v3 } from 'googleapis';
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
import { KEP_myExamsCmdImpl } from '../../../Commands/Guild/Impl/KEP_myExamsCmdImpl';
import { KEP_myScheduleCmdImpl } from '../../../Commands/Guild/Impl/KEP_myScheduleCmdImpl';
import { KEP_registrationCmdImpl } from '../../../Commands/Guild/Impl/KEP_registrationCmdImpl';
import { KEP_teacherCmdImpl } from '../../../Commands/Guild/Impl/KEP_teacherCmdImpl';
import { GuildCommandManagerImpl } from '../../../Commands/Managers/Impl/GuildCommandManagerImpl';
import { Course } from '../../../Entities/KEP/Course';
import { Student } from '../../../Entities/KEP/Student';
import { fetchCourses } from '../../../Queries/KEP/Course';
import { dropDrivePermission, fetchDrivePermissions } from '../../../Queries/KEP/Drive';
import { dropMutedMember, fetchMutedMembers, findMutedMember } from '../../../Queries/KEP/Member';
import { banStudent, dropAllPendingStudents, dropStudents, fetchStudents, unbanStudent } from '../../../Queries/KEP/Student';
import { fetchEvents } from '../../../tools/Google/Gcalendar';
import { deleteDrivePermission } from '../../../tools/Google/Gdrive';
import { scheduleTask } from '../../../tools/scheduler';
import { AbstractGuild } from "../AbstractGuild";
import { GenericGuild } from "../GenericGuild";
moment.locale('el');
moment.tz("Europe/Athens");


const guildCommands = [
    //KEP_announceCmdImpl,
    KEP_registrationCmdImpl,
    KEP_adminCmdImpl,
    KEP_myExamsCmdImpl,
    KEP_myScheduleCmdImpl,
    KEP_infoCmdImpl,
    KEP_driveCmdImpl,
    KEP_dataCmdImpl,
    KEP_muteCmdImpl,
    KEP_courseCmdImpl,
    KEP_courseTeacherCmdImpl,
    KEP_teacherCmdImpl,
    KEP_eventsCmdImpl
]

//TODO: create reminders for courses
export class KepGuild extends AbstractGuild implements GenericGuild {
    public events: calendar_v3.Schema$Event[];
    public students: Collection<Snowflake, Student>;
    public courses: Course[];
    public courseRoles: Role[];
    private constructor(id: Snowflake) {
        super(id);
    }

    static async init(guild_id: Snowflake): Promise<GenericGuild> {
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
        this.events = await fetchEvents();
        this.students = await fetchStudents();
        const members = await this.guild.members.fetch()
        this.courses = await fetchCourses();
        //load students
        for (const student of this.students.values()) {
            const member = members.get(student.member_id);
            if (!member) {
                await dropStudents({ am: student.am }).catch(console.error);
                continue;
            }
            for (const c of this.courses)
                if (member.roles.cache.has(c.role_id))
                    this.students.get(student.member_id).courses.set(c.role_id, c);
        }
        handleExaminedChannels(this.courses, this.events, this.guild.channels);
        handleActiveDrivePermissions();
        handleMutedMembers(this.guild);
        if (!inDevelopment) await dropAllPendingStudents();
        return Promise.resolve('KEP Loaded');
    }

    async onMessage(message: Message): Promise<unknown> {
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
                await message.react('👎');
                await message.react('👍');
                break;
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
                new MessageEmbed(
                    {
                        author: {
                            name: message.author.username,
                            icon_url: message.author.avatarURL({ format: 'png' })
                        },
                        color: `#ffffff`,
                        description: `**🗑️ Διεγράφη Μήνυμα από ${message.member.toString()} στο ${message.channel.toString()}**
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
                const logEmbeds: MessageEmbed[] = [];
                if (added.length > 0) logEmbeds.push(
                    new MessageEmbed(header)
                        .setColor("BLUE")
                        .addFields([{ name: 'Προστέθηκαν', value: added }])
                );
                if (removedRoles.size > 0) logEmbeds.push(
                    new MessageEmbed(header)
                        .setColor("RED")
                        .addFields([{
                            name: 'Αφαιρέθηκαν', value: removedRoles
                                .map(r => `**• ${r.name}**`)
                                .join('\n')
                        }])
                );

                if (logEmbeds.length === 0)
                    logEmbeds.push(new MessageEmbed(header).setDescription("Δεν υπήρξαν αλλαγές"))

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
                    await appealChannel.send({
                        content: `<@${userid}>`,
                        embeds: [
                            new MessageEmbed({
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
                        new MessageEmbed({
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
        logs.send(`Banned ${user.username}`);
        return banStudent(user.id);
    }

    async onGuildBanRemove(unban: GuildBan) {
        await super.onGuildBanRemove(unban);
        const { user } = unban;
        const logs = this.guild.channels.cache.get(channels.logs) as TextChannel;
        logs.send(`Unbanned ${user.username}`);
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
                const headerEmb = new MessageEmbed({
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
                        new MessageEmbed(headerEmb)
                            .setDescription(`Unmuted ${member.toString()}`)
                    ]
                })
            }
        })
    }
}
