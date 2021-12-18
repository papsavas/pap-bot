import {
    BaseCommandInteraction,
    ButtonInteraction,
    Client, Guild,
    GuildBan,
    GuildMember, Message, MessageEmbed, MessageReaction, SelectMenuInteraction,
    Snowflake, User, VoiceState
} from 'discord.js';
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
import { openVoiceCmdImpl } from './../../Commands/Guild/Impl/openVoiceCmdImpl';
import { GenericGuild } from "./GenericGuild";




export abstract class AbstractGuild implements GenericGuild {

    private _responses: string[];
    private _settings: GuildSettings;
    private _userResponses: MemberResponses;
    private _guild: Guild;

    //keeping it on cache, not that important
    private privateVoiceChannels: Snowflake[] = [];

    protected readonly guildID: Snowflake;
    protected specifiedCommands?: Promise<GenericGuildCommand>[];

    protected _genericCommands: Promise<GenericGuildCommand>[] = [
        PollCmdImpl,
        MessageChannelCmdImpl, ClearMessagesCmdImpl, EditMessageCmdImpl,
        commandPermsCmdImpl, ShowPermsCmdsImpl,
        myResponsesCmdImpl, bookmarkCmdImpl,
        PinMessageCmdImpl, UnpinMessageCmdImpl, openVoiceCmdImpl, settingsCmdImpl
    ].map(cmd => cmd.init())

    commandManager: GuildCommandManager;

    protected constructor(guild_id: Snowflake) {
        this.guildID = guild_id;
    }

    get guild(): Guild {
        return this._guild;
    }

    get userResponses(): MemberResponses {
        return this._userResponses;
    }

    static async init(guild_id: Snowflake): Promise<unknown> { return Promise.resolve() };

    getSettings(): GuildSettings {
        return this._settings;
    }

    async onReady(client: Client): Promise<unknown> {
        this._guild = client.guilds.cache.get(this.guildID);
        this._settings = await fetchGuildSettings(this.guildID);
        await this.loadResponses()
        return Promise.resolve(`loaded ${this.guild.name}`);
    }

    onGuildJoin(guild: Guild) {
        return this.commandManager.updateCommands(guild.commands)
    }

    async onGuildLeave(guild: Guild) {
        dropGuild(guild);
        await this.commandManager.clearCommands(guild.commands).catch(console.error);
    }

    onGuildMemberAdd(member: GuildMember): Promise<any> {
        return Promise.resolve(`member ${member.displayName} joined the guild`);

    }

    onGuildMemberRemove(member: GuildMember): Promise<any> {
        return Promise.resolve(`member ${member.displayName} left the guild`);
    }

    onGuildMemberUpdate(oldMember: GuildMember, newMember: GuildMember): Promise<any> {
        return Promise.resolve(`member ${newMember.displayName} updated`);
    }

    onSlashCommand(interaction: BaseCommandInteraction): Promise<any> {
        return this.commandManager.onSlashCommand(interaction);
    }

    onButton(interaction: ButtonInteraction): Promise<any> {
        return Promise.resolve(`button ${interaction.customId} received from ${interaction.guild.name}`);
    }

    onSelectMenu(interaction: SelectMenuInteraction): Promise<any> {
        return Promise.resolve(`select ${interaction.customId} received from ${interaction.guild.name}`);
    }

    async onMessage(message: Message): Promise<any> {
        if (message.content.startsWith(this._settings.prefix)) {
            return this.commandManager.onManualCommand(message);
        }

        if (message.mentions.users.first()?.id === message.client.user.id) {
            return message.channel.sendTyping()
                .then(() => message.reply(randomArrayValue(this._responses)))
                .catch(err => console.log(err));
        }

        return Promise.resolve(`message received`);
    }

    onMessageDelete(deletedMessage: Message): Promise<any> {
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
                        new MessageEmbed({
                            author: {
                                name: reaction.message.author.tag,
                                icon_url: reaction.message.author.avatarURL({ format: 'png' })
                            },
                            thumbnail: {
                                url: reaction.message.guild.iconURL({ format: 'png', size: 256 })
                            },
                            title: `🔖 Message Bookmark`,
                            description: `from ${reaction.message.channel.toString()} [${reaction.message.guild.name}]\n
[${reaction.message.content.length > 1 ? reaction.message.content.substr(0, 500) + "..." : `Jump`}](${reaction.message.url})`,
                            color: `#fe85a6`,
                            image: { url: reaction.message.attachments.first()?.url },
                            timestamp: new Date(),
                        }), ...reaction.message.embeds.map(emb => new MessageEmbed(emb))
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

    onMessageReactionRemove(reaction: MessageReaction, user: User): Promise<any> {
        return Promise.resolve(`reaction removed`);
    }

    async onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
        const clientMember = newState.guild.members.cache.get(newState.client.user.id);
        if (!clientMember.permissions.has('ADMINISTRATOR'))
            return
        const member = newState.member;
        const [joined, left] = [
            !!newState.channel,
            //if user was on voice AND if newState is another channel or null(disconnected)
            !!oldState.channel && oldState?.channel?.id !== newState?.channel?.id
        ];
        if (joined) {
            if (newState.channel.id === this._settings.voice_lobby) {
                const categoryId = newState.channel.parentId;
                const privateChannel = await newState.guild.channels.create(
                    `🔒 ${member.displayName}'s table`,
                    {
                        parent: categoryId,
                        permissionOverwrites: [{
                            id: member.id,
                            type: 'member',
                            allow: [
                                'VIEW_CHANNEL',
                                'CONNECT',
                                'SPEAK',
                                'STREAM',
                                'MOVE_MEMBERS',
                                'MUTE_MEMBERS',
                                'MANAGE_CHANNELS'
                            ]
                        },
                        {
                            id: member.guild.id,
                            type: 'role',
                            deny: ['CONNECT']
                        }
                        ],
                        type: "GUILD_VOICE",
                        position: newState.channel.position + 1,
                        reason: "self create private channel"
                    }
                );
                await newState.setChannel(privateChannel, 'move to personal channel');
                member.send(`Use \`/open-voice\` command to unlock this channel for others (roles or users)`)
                    .then(msg => msg.react("🗑"))
                    .catch();
                this.privateVoiceChannels.push(privateChannel.id);
            }
        }
        if (left) {
            const channel = oldState.channel;
            if (this.privateVoiceChannels.includes(channel.id) && channel.members.size === 0)
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
        this._settings.prefix = newPrefix;
    }

    patchVoiceLobbySetting(v: Snowflake): void {
        this._settings.voice_lobby = v;
    }

    fetchCommands() {
        return this.guild.commands.fetch();
    }

    async loadResponses() {
        const genericResponses = await genericGuildResponses(this.guildID, this._settings?.nsfw_responses);
        const memberResponses: string[] = await fetchAllGuildMemberResponses(this.guildID);
        this._responses = memberResponses.concat(genericResponses);
    }

}