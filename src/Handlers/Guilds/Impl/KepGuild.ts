//WIP

import { GuildChannel, Message, MessageReaction, Snowflake, TextChannel, User } from 'discord.js';
import urlRegex from 'url-regex';
import { channels } from "values/KEP/IDs.json";
import { channels as WOAPchannels } from "values/WOAP/IDs.json";
import { KEP_announceCmdImpl } from '../../../Commands/Guild/Impl/KEP_announceCmdImpl';
import { GuildCommandManagerImpl } from '../../../Commands/Managers/Impl/GuildCommandManagerImpl';
import { sendEmail } from '../../../tools/Google/Gmail';
import { AbstractGuild } from "../AbstractGuild";
import { GenericGuild } from "../GenericGuild";

const specifiedCommands = [KEP_announceCmdImpl]; //add guild specific commands
export class KepGuild extends AbstractGuild implements GenericGuild {
    private constructor(id: Snowflake) {
        super(id);
    }

    static async init(guild_id: Snowflake): Promise<GenericGuild> {
        const guild = new KepGuild(guild_id);
        guild.specifiedCommands = specifiedCommands.map(cmd => cmd.init());
        guild.commandManager = new GuildCommandManagerImpl(
            guild_id,
            await Promise.all(
                guild._genericCommands
                    .concat(guild.specifiedCommands ?? [])) //merge specified commands if any

        );
        return guild;
    }

    async onMessage(message: Message): Promise<unknown> {
        switch (message.channel.id) { //channels
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

            default: return Promise.resolve('no referenced channel');
        }

        switch ((message.channel as GuildChannel).parentId) { //categories
            case channels.registration: //!replace this with single registration channel
                return registration(message);
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

async function emailStudent(email: string) {
    //await save rand number with email
    return sendEmail(
        email,
        "Επαλήθευση Λογαριασμού",
        "Προσθέστε αυτόν τον αριθμό..."
    )
}

async function registration(message: Message): Promise<unknown> {
    if (message.channel.id === channels.registration) {
        const email = message.cleanContent//.match(/*emailRegex*/)
        return email ? emailStudent(email) : message.react('❌');
    }
}