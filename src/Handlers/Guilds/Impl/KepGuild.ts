import { Collection, GuildChannel, GuildChannelManager, Message, MessageReaction, Snowflake, TextChannel, User } from 'discord.js';
import { calendar_v3 } from 'googleapis';
import urlRegex from 'url-regex';
import { channels } from "../../../../values/KEP/IDs.json";
import { examsPrefix } from "../../../../values/KEP/literals.json";
import { channels as WOAPchannels } from "../../../../values/WOAP/IDs.json";
import { KEP_adminCmdImpl } from '../../../Commands/Guild/Impl/KEP_adminCmdImpl';
import { KEP_announceCmdImpl } from '../../../Commands/Guild/Impl/KEP_announceCmdImpl';
import { KEP_myExamsCmdImpl } from '../../../Commands/Guild/Impl/KEP_myExamsCmdImpl';
import { GuildCommandManagerImpl } from '../../../Commands/Managers/Impl/GuildCommandManagerImpl';
import { Student } from '../../../Entities/KEP/Student';
import { fetchStudents } from '../../../Queries/KEP/Student';
import { fetchUniClasses } from '../../../Queries/KEP/uniClass';
import { textSimilarity } from '../../../tools/cmptxt';
import { fetchEvents } from '../../../tools/Google/Gcalendar';
import { scheduleTask } from '../../../tools/scheduler';
import { AbstractGuild } from "../AbstractGuild";
import { GenericGuild } from "../GenericGuild";
import { uniClass } from './../../../Entities/KEP/uniClass';

const guildCommands = [
    KEP_announceCmdImpl,
    KEP_adminCmdImpl,
    KEP_myExamsCmdImpl
]
export class KepGuild extends AbstractGuild implements GenericGuild {
    public events: calendar_v3.Schema$Event[];
    public students: Collection<Snowflake, Student>;
    public classes: uniClass[];
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
        guild.events = await fetchEvents();
        guild.students = await fetchStudents();
        guild.classes = await fetchUniClasses();
        handleExamedChannels(guild.classes, guild.events, guild.guild.channels);
        return guild;
    }

    async onReady(client): Promise<unknown> {
        return super.onReady(client);

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
            }
        } catch (error) {
            console.log(error);
        } finally {
            return Promise.resolve();
        }
    }
}

function handleExamedChannels(classes: uniClass[], events: calendar_v3.Schema$Event[], channelManager: GuildChannelManager): Promise<unknown>[] {
    return events.map(ev => {
        const uniClass = classes.find(cl =>
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
        if (uniClass) {
            const channel = channelManager.cache.get(uniClass.channel_id) as GuildChannel;
            return scheduleTask(
                ev.start.dateTime,
                () => channel.permissionOverwrites.edit(uniClass.role_id, {
                    SEND_MESSAGES: false
                })
            ).then(() => scheduleTask(
                ev.end.dateTime,
                () => channel.permissionOverwrites.edit(uniClass.role_id, {
                    SEND_MESSAGES: true
                })
            ));
        }
    });

}