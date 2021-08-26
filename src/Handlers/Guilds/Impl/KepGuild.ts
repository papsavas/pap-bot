import { ButtonInteraction, Client, Collection, GuildBan, GuildChannel, GuildChannelManager, GuildMember, Message, MessageEmbed, MessageReaction, Role, SelectMenuInteraction, Snowflake, TextChannel, User } from 'discord.js';
import { calendar_v3 } from 'googleapis';
import moment from "moment-timezone";
import 'moment/locale/el';
import urlRegex from 'url-regex';
import { channels, roles } from "../../../../values/KEP/IDs.json";
import { buttons, examsPrefix } from "../../../../values/KEP/literals.json";
import { channels as WOAPchannels } from "../../../../values/WOAP/IDs.json";
import { KEP_adminCmdImpl } from '../../../Commands/Guild/Impl/KEP_adminCmdImpl';
import { KEP_dataCmdImpl } from '../../../Commands/Guild/Impl/KEP_dataCmdImpl';
import { KEP_driveCmdImpl } from '../../../Commands/Guild/Impl/KEP_driveCmdImpl';
import { KEP_infoCmdImpl } from '../../../Commands/Guild/Impl/KEP_infoCmdImpl';
import { KEP_myExamsCmdImpl } from '../../../Commands/Guild/Impl/KEP_myExamsCmdImpl';
import { KEP_myScheduleCmdImpl } from '../../../Commands/Guild/Impl/KEP_myScheduleCmdImpl';
import { KEP_registrationCmdImpl } from '../../../Commands/Guild/Impl/KEP_registrationCmdImpl';
import { GuildCommandManagerImpl } from '../../../Commands/Managers/Impl/GuildCommandManagerImpl';
import { Course } from '../../../Entities/KEP/Course';
import { Student } from '../../../Entities/KEP/Student';
import { fetchCourses } from '../../../Queries/KEP/Course';
import { dropDrivePermission, fetchDrivePermissions } from '../../../Queries/KEP/Drive';
import { banStudent, dropStudents, fetchStudents, unbanStudent } from '../../../Queries/KEP/Student';
import { textSimilarity } from '../../../tools/cmptxt';
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
    KEP_dataCmdImpl
]
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
        return Promise.resolve('KEP Loaded');
    }

    async onMessage(message: Message): Promise<unknown> {
        switch (message.channel.id) { //channels
            case channels.registration: {
                if (message.type === "DEFAULT") {
                    if (message.deletable) await message.delete();
                    await message.member.send({ content: `Παρακαλώ χρησιμοποιείστε **slash command** πατώντας \`/\` στο κανάλι <#${channels.registration}> και επιλέγοντας \`/registration register\`` })
                        .catch();
                }
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
                        message.attachments.size === 0 ||
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
                    return Promise.resolve();
            }
        } catch (error) {
            console.log(error);
        }
    }

    async onSelectMenu(select: SelectMenuInteraction) {
        switch (select.channel.id) {
            case channels.select_courses: {
                const codes = select.values;
                const semester = select.customId;
                const semesterCourses = this.courses.filter(c => c.semester == semester)
                const selectedCourses = this.courses.filter(cl => codes.includes(cl.code));
                const semesterRolesIds: Snowflake[] = semesterCourses.map(c => c.role_id);
                const member = await select.guild.members.fetch(select.user.id);
                const oldSemesterRoles = member.roles.cache.filter(r => semesterRolesIds.includes(r.id));
                await member.roles.remove(semesterRolesIds);
                await member.roles.add(selectedCourses.map(c => c.role_id));
                //! filtering courses with roles & vice versa might cause name variance
                const newSemesterCourses = selectedCourses.filter(c => !oldSemesterRoles.has(c.role_id));
                const [added, removedRoles] = [
                    newSemesterCourses
                        .map(c => `**• ${c.name}**`)
                        .join('\n'),
                    oldSemesterRoles
                        .filter(r => !selectedCourses.find(c => c.role_id === r.id))
                ]

                const studentCourses = this.students.get(member.id).courses;
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
                return select.reply({
                    embeds: logEmbeds,
                    ephemeral: true
                });
            }

        }
    }

    async onButton(interaction: ButtonInteraction) {
        switch (interaction.channel.id) {
            case channels.registration: {
                if (interaction.customId.startsWith(buttons.appealId)) {
                    const [appealLiteral, am, userid] = interaction.customId.split('_');
                    const threadName = `${am}_${userid}`
                    const channel = interaction.channel as TextChannel;
                    const existingThread = channel.threads.cache.find(c => c.name === threadName)
                    if (existingThread)
                        return interaction.reply({
                            content: `Έχει ήδη δημιουργηθεί thread <#${existingThread.id}>`,
                            ephemeral: true
                        })

                    const thread = await channel.threads.create({
                        autoArchiveDuration: "MAX",
                        name: threadName,
                        reason: "appeal",
                        type: "GUILD_PRIVATE_THREAD",
                    });
                    const conflictingStudent = this.students.find(s => s.am === am);
                    thread.send({
                        content: `<@&${roles.head_mod}> <@${userid}>`,
                        embeds: [
                            new MessageEmbed({
                                title: "Έφεση",
                                description: `<@${userid}> Θα πρέπει να στείλετε εδώ μία φωτογραφία της ακαδημαϊκή σας ταυτότητα με εμφανή τον αριθμό μητρώου`,
                                fields: [{
                                    name: "Συγκρουόμενος Λογαριασμός:",
                                    value: `<@${conflictingStudent.member_id}>`,
                                    inline: true
                                }],
                                timestamp: new Date(),
                                color: "RANDOM"
                            })
                        ]
                    })
                        .then(msg =>
                            interaction.reply({
                                content: `Δημιουργήθηκε ιδιωτικό thread <#${thread.id}>. Παρακαλώ αποστείλετε εκεί την φωτογραφία της ακαδημαϊκής σας ταυτότητας`,
                                ephemeral: true
                            })
                        )
                        .catch(console.error);

                }
                break;
            }
        }
    }

    async onGuildMemberRemove(member: GuildMember): Promise<unknown> {
        this.students.delete(member.id)
        return dropStudents({
            member_id: member.id
        });
    }

    onGuildBanAdd(ban: GuildBan) {
        const { user } = ban;
        const logs = this.guild.channels.cache.get(channels.logs) as TextChannel;
        logs.send(`Banned ${user.username}`);
        return banStudent(user.id);
    }

    onGuildBanRemove(unban: GuildBan) {
        const { user } = unban;
        const logs = this.guild.channels.cache.get(channels.logs) as TextChannel;
        logs.send(`Unbanned ${user.username}`);
        return unbanStudent(user.id);
    }
}

function handleExaminedChannels(courses: Course[], events: calendar_v3.Schema$Event[], channelManager: GuildChannelManager): Promise<unknown>[] {
    return events.map(ev => {
        const course = courses.find(cl =>
            textSimilarity(
                ev.summary
                    .replace(examsPrefix, '')
                    .trimStart()
                    .trimEnd(),
                cl.name
            ) > 0.85 ||
            cl.code === ev.summary
                .replace(examsPrefix, '')
                .trimStart()
                .trimEnd()
        );
        if (course) {
            const channel = channelManager.cache.get(course.channel_id) as GuildChannel;
            return scheduleTask(
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
                if (p.destroyedAt.getTime() < Date.now()) {
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