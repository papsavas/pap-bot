import {
    ButtonInteraction, ChannelType, Client, Colors, CommandInteraction, Embed, Guild,
    GuildBan, GuildMember, Message, MessageReaction, PermissionFlagsBits, SelectMenuInteraction,
    Snowflake, User, VoiceState
} from 'discord.js';
import { OverwriteType } from 'discord.js/node_modules/discord-api-types/v9';
import { GenericGuildCommand } from '../../Commands/Guild/GenericGuildCommand';
import { bookmarkCmdImpl } from '../../Commands/Guild/Impl/bookmarkCmdImpl';
import { ClearMessagesCmdImpl } from "../../Commands/Guild/Impl/clearMessagesCmdImpl";
import { commandPermsCmdImpl } from '../../Commands/Guild/Impl/commandPermsCmdImpl';
import { EditMessageCmdImpl } from "../../Commands/Guild/Impl/editMessageCmdImpl";
import { MessageChannelCmdImpl } from "../../Commands/Guild/Impl/messageChannelCmdImpl";
import { myResponsesCmdImpl } from "../../Commands/Guild/Impl/myResponsesCmdImpl";
import { PinMessageCmdImpl } from '../../Commands/Guild/Impl/pinMessageCmdImpl';
import { PollCmdImpl } from "../../Commands/Guild/Impl/pollCmdImpl";
import { settingsCmdImpl } from '../../Commands/Guild/Impl/settingsCmdImpl';
import { ShowPermsCmdsImpl } from "../../Commands/Guild/Impl/showPermsCmdsImpl";
import { UnpinMessageCmdImpl } from '../../Commands/Guild/Impl/unpinMessageCmdImpl';
import { GuildCommandManager } from "../../Commands/Managers/Interf/GuildCommandManager";
import { GuildSettings } from "../../Entities/Generic/guildSettings";
import { MemberResponses } from "../../Entities/Generic/MemberResponses";
import { genericGuildResponses } from "../../Queries/Generic/GenericGuildResponses";
import { dropGuild } from '../../Queries/Generic/Guild';
import { fetchGuildSettings } from '../../Queries/Generic/GuildSettings';
import { fetchAllGuildMemberResponses } from "../../Queries/Generic/MemberResponses";
import { randomArrayValue } from "../../tools/randomArrayValue";
import AbstractHandler from '../AbstractHandler';
import { openVoiceCmdImpl } from './../../Commands/Guild/Impl/openVoiceCmdImpl';
import { GenericGuild } from "./GenericGuild";




export abstract class AbstractGuild extends AbstractHandler implements GenericGuild {

    #responses: string[] = null;
    #settings: GuildSettings = null;
    #userResponses: MemberResponses = null;
    #guild: Guild = null;

    //keeping it on cache, not that important
    #privateVoiceChannels: Snowflake[] = [];

    protected readonly guildId: Snowflake = null;
    protected specifiedCommands?: Promise<GenericGuildCommand>[];

    protected _genericCommands: Promise<GenericGuildCommand>[] = [
        PollCmdImpl,
        MessageChannelCmdImpl, ClearMessagesCmdImpl, EditMessageCmdImpl,
        commandPermsCmdImpl, ShowPermsCmdsImpl,
        myResponsesCmdImpl, bookmarkCmdImpl,
        PinMessageCmdImpl, UnpinMessageCmdImpl, openVoiceCmdImpl, settingsCmdImpl
    ].map(cmd => cmd.init())

    commandManager: GuildCommandManager = null;

    protected constructor(guild_id: Snowflake) {
        super(guild_id);
        this.guildId = guild_id;
    }

    get guild(): Guild {
        return this.#guild;
    }

    get userResponses(): MemberResponses {
        return this.#userResponses;
    }

    getSettings(): GuildSettings {
        return this.#settings;
    }

    async onReady(client: Client): Promise<unknown> {
        this.#guild = client.guilds.cache.get(this.guildId);
        this.#settings = await fetchGuildSettings(this.guildId);
        await this.loadResponses()
        return super.onReady(client);
    }

    onGuildJoin(guild: Guild) {
        return this.commandManager.updateCommands(guild.commands)
    }

    async onGuildLeave(guild: Guild) {
        dropGuild(guild);
        await this.commandManager.clearCommands(guild.commands).catch(console.error);
    }

    onGuildMemberAdd(member: GuildMember): Promise<unknown> {
        return Promise.resolve(`member ${member.displayName} joined the guild`);

    }

    onGuildMemberRemove(member: GuildMember): Promise<unknown> {
        return Promise.resolve(`member ${member.displayName} left the guild`);
    }

    onGuildMemberUpdate(oldMember: GuildMember, newMember: GuildMember): Promise<unknown> {
        return Promise.resolve(`member ${newMember.displayName} updated`);
    }

    onCommand(interaction: CommandInteraction): Promise<unknown> {
        return this.commandManager.onCommand(interaction);
    }

    onButton(interaction: ButtonInteraction): Promise<unknown> {
        return interaction.reply({
            content: `[${interaction.component.type}]: No action specified`,
            ephemeral: true
        });
    }

    onSelectMenu(interaction: SelectMenuInteraction): Promise<unknown> {
        return interaction.reply({
            content: `[${interaction.component.type}]: No action specified`,
            ephemeral: true
        });
    }

    async onMessage(message: Message): Promise<unknown> {
        if (message.content.startsWith(this.#settings.prefix)) {
            return this.commandManager.onManualCommand(message);
        }

        if (message.mentions.users.first()?.id === message.client.user.id) {
            return message.channel.sendTyping()
                .then(() => message.reply(randomArrayValue(this.#responses)))
                .catch(err => console.log(err));
        }

        return Promise.resolve(`message received`);
    }

    onMessageDelete(deletedMessage: Message): Promise<unknown> {
        return Promise.resolve(`deleted a message with id:${deletedMessage.id} in ${deletedMessage.channel.isText?.name}`);
    }

    async onMessageReactionAdd(reaction: MessageReaction, user: User): Promise<unknown> {
        switch (reaction.emoji.name) {
            case "📌": case "📍": {
                let response: string;
                if (!reaction.message.pinnable) {
                    response = `*${user.username} this message cannot be pinned by you*`;
                }
                else if (reaction.message.pinned) {
                    response = `Message is already pinned`
                }
                else {
                    try {
                        await reaction.message.pin();
                        return
                    } catch (error) {
                        response = error.toString()
                    }
                }
                const msg = await reaction.message.channel.send(response);
                await msg.react("🗑️");
                const collected = await msg.awaitReactions({
                    filter: (reaction, user) => ['🗑️', '🗑'].includes(reaction.emoji.name) && !user.bot,
                    time: 10000,
                    max: 1
                })
                await msg.delete();
                break
            }

            case "🔖": case "📑":
                return user.send({
                    embeds: [
                        new Embed({
                            author: {
                                name: reaction.message.author.tag,
                                icon_url: reaction.message.author.avatarURL({ extension: 'png' })
                            },
                            thumbnail: {
                                url: reaction.message.guild.iconURL({ extension: 'png', size: 256 })
                            },
                            title: `🔖 Message Bookmark`,
                            description: `from ${reaction.message.channel.toString()} [${reaction.message.guild.name}]\n
[${reaction.message.content.length > 1 ? reaction.message.content.substr(0, 500) + "..." : `Jump`}](${reaction.message.url})`,
                            color: Colors.LuminousVividPink,
                            image: { url: reaction.message.attachments.first()?.url },
                            timestamp: new Date(),
                        }), ...reaction.message.embeds.map(emb => new Embed(emb))
                    ]


                }).catch()

            case '🗑️': case '🗑':
                if (reaction.count >= 10 && reaction.message.deletable)
                    return reaction.message.delete();
            default:
                break
        }
        return Promise.resolve(`reaction added`);
    }

    onMessageReactionRemove(reaction: MessageReaction, user: User): Promise<unknown> {
        return Promise.resolve(`reaction removed`);
    }

    async onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<unknown> {
        const clientMember = newState.guild.members.cache.get(newState.client.user.id);
        if (!clientMember.permissions.has(PermissionFlagsBits.Administrator))
            return
        const member = newState.member;
        const [joined, left] = [
            !!newState.channel,
            //if user was on voice AND if newState is another channel or null(disconnected)
            !!oldState.channel && oldState?.channel?.id !== newState?.channel?.id
        ];
        if (joined) {
            if (newState.channel.id === this.#settings.voice_lobby) {
                const categoryId = newState.channel.parentId;
                const privateChannel = await newState.guild.channels.create(
                    `🔒 ${member.displayName}'s table`,
                    {
                        parent: categoryId,
                        permissionOverwrites: [{
                            id: member.id,
                            type: OverwriteType.Member,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.Connect,
                                PermissionFlagsBits.Speak,
                                PermissionFlagsBits.Stream,
                                PermissionFlagsBits.MoveMembers,
                                PermissionFlagsBits.MuteMembers,
                                PermissionFlagsBits.ManageChannels
                            ]
                        },
                        {
                            id: member.guild.id,
                            type: OverwriteType.Role,
                            deny: [PermissionFlagsBits.Connect]
                        }
                        ],
                        type: ChannelType.GuildVoice,
                        position: newState.channel.position + 1,
                        reason: "self create private channel"
                    }
                );
                await newState.setChannel(privateChannel, 'move to personal channel');
                member.send(`Use \`/open-voice\` command to unlock this channel for others (roles or users)`)
                    .then(msg => msg.react("🗑"))
                    .catch();
                this.#privateVoiceChannels.push(privateChannel.id);
            }
        }
        if (left) {
            const channel = oldState.channel;
            if (this.#privateVoiceChannels.includes(channel.id) && channel.members.size === 0)
                await channel.delete();
        }
    }

    onGuildBanAdd(ban: GuildBan): Promise<unknown> {
        return Promise.resolve(`banned ${ban.user.tag}`);
    }

    onGuildBanRemove(ban: GuildBan): Promise<unknown> {
        return Promise.resolve(`unbanned ${ban.user.tag}`);
    }

    setPrefix(newPrefix: string): void {
        this.#settings.prefix = newPrefix;
    }

    patchVoiceLobbySetting(v: Snowflake): void {
        this.#settings.voice_lobby = v;
    }

    fetchCommands() {
        return this.guild.commands.fetch();
    }

    async loadResponses() {
        const genericResponses = await genericGuildResponses(this.guildId, this.#settings?.nsfw_responses);
        const memberResponses: string[] = await fetchAllGuildMemberResponses(this.guildId);
        this.#responses = memberResponses.concat(genericResponses);
    }

}