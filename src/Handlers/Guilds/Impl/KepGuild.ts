import { Client, Collection, GuildBan, GuildChannel, GuildChannelManager, Message, MessageEmbed, MessageReaction, Role, SelectMenuInteraction, Snowflake, TextChannel, User } from 'discord.js';
import { calendar_v3 } from 'googleapis';
import urlRegex from 'url-regex';
import { channels } from "../../../../values/KEP/IDs.json";
import { examsPrefix } from "../../../../values/KEP/literals.json";
import { channels as WOAPchannels } from "../../../../values/WOAP/IDs.json";
import { KEP_adminCmdImpl } from '../../../Commands/Guild/Impl/KEP_adminCmdImpl';
import { KEP_myExamsCmdImpl } from '../../../Commands/Guild/Impl/KEP_myExamsCmdImpl';
import { KEP_myScheduleCmdImpl } from '../../../Commands/Guild/Impl/KEP_myScheduleCmdImpl';
import { GuildCommandManagerImpl } from '../../../Commands/Managers/Impl/GuildCommandManagerImpl';
import { Course } from '../../../Entities/KEP/Course';
import { Student } from '../../../Entities/KEP/Student';
import { fetchCourses } from '../../../Queries/KEP/Course';
import { banStudent, dropStudents, fetchStudents, unbanStudent } from '../../../Queries/KEP/Student';
import { textSimilarity } from '../../../tools/cmptxt';
import { fetchEvents } from '../../../tools/Google/Gcalendar';
import { scheduleTask } from '../../../tools/scheduler';
import { AbstractGuild } from "../AbstractGuild";
import { GenericGuild } from "../GenericGuild";

const guildCommands = [
    //KEP_announceCmdImpl,
    KEP_adminCmdImpl,
    KEP_myExamsCmdImpl,
    KEP_myScheduleCmdImpl
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

            case channels.anonymous: {
                if (message.embeds.length > 0) {
                    await message.startThread({
                        name: message.embeds[0].footer.text,
                        autoArchiveDuration: 1440
                    }).catch(err => console.log(`could not create anonymous thread\n` + err.toString()));

                }
                break;
            }

            case channels.memes: {
                if (message.attachments.size === 0 || !urlRegex({ strict: true, exact: false }).test(message.content) && message.deletable)
                    await message.delete();
                break;
            }

            case channels.feedback: {
                await message.react('👎');
                await message.react('👍');
                break;
            }

            default:
                return Promise.resolve('no referenced channel');
        }

        switch ((message.channel as GuildChannel).parentId) { //categories

            default:
                return Promise.resolve('no referenced category');
        }
    }

    async onMessageReactionAdd(reaction: MessageReaction, user: User): Promise<unknown> {
        try {
            switch (reaction.message.channel.id) {
                case channels.anonymous_approval: {
                    const targetChannel = reaction.message.guild.channels.cache.get(channels.anonymous) as TextChannel;
                    const emb = reaction.message.embeds[0];
                    switch (reaction.emoji.name) {
                        case '✅': {
                            try {
                                await targetChannel.send({ embeds: [emb] });
                                await reaction.message.reactions.removeAll();
                                reaction.message.react('☑');
                            } catch (err) {
                                console.log(err);
                            }
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