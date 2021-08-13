import {
    ButtonInteraction,
    Client, CommandInteraction, Constants, ContextMenuInteraction, Guild,
    GuildMember, Message, MessageEmbed, MessageReaction, SelectMenuInteraction,
    Snowflake, User
} from 'discord.js';
import { mentionRegex } from "../../../botconfig.json";
import { GenericGuildCommand } from '../../Commands/Guild/GenericGuildCommand';
import { AddResponseCmdImpl } from "../../Commands/Guild/Impl/addResponseCmdImpl";
import { bookmarkCmdImpl } from '../../Commands/Guild/Impl/bookmarkCmdImpl';
import { ClearMessagesCmdImpl } from "../../Commands/Guild/Impl/clearMessagesCmdImpl";
import { DmMemberCmdImpl } from "../../Commands/Guild/Impl/dmMemberCmdImpl";
import { EditMessageCmdImpl } from "../../Commands/Guild/Impl/editMessageCmdImpl";
import { LockCommandCmdImpl } from "../../Commands/Guild/Impl/lockCommandCmdImpl";
import { MessageChannelCmdImpl } from "../../Commands/Guild/Impl/messageChannelCmdImpl";
import { NsfwSwitchCmdImpl } from "../../Commands/Guild/Impl/nsfwSwitchCmdImpl";
import { PinMessageCmdImpl } from "../../Commands/Guild/Impl/pinMessageCmdImpl";
import { PollCmdImpl } from "../../Commands/Guild/Impl/pollCmdImpl";
import { RemovePersonalResponseCmdImpl } from "../../Commands/Guild/Impl/removePersonalResponseCmdImpl";
import { SetPrefixCmdImpl } from "../../Commands/Guild/Impl/setPrefixCmdImpl";
import { ShowLogsCmdImpl } from "../../Commands/Guild/Impl/showLogsCmdImpl";
import { ShowPermsCmdsImpl } from "../../Commands/Guild/Impl/showPermsCmdsImpl";
import { ShowPersonalResponsesCmdImpl } from "../../Commands/Guild/Impl/showPersonalResponsesCmdImpl";
import { UnlockCommandCmdImpl } from "../../Commands/Guild/Impl/unlockCommandCmdImpl";
import { UnpinMessageCmdImpl } from "../../Commands/Guild/Impl/unpinMessageCmdImpl";
import { GuildCommandManager } from "../../Commands/Managers/Interf/GuildCommandManager";
import { guildSettings } from "../../Entities/Generic/guildSettings";
import { memberResponses } from "../../Entities/Generic/MemberResponses";
import { genericGuildResponses } from "../../Queries/Generic/GenericGuildResponses";
import { addLog } from "../../Queries/Generic/guildLogs";
import { fetchGuildSettings } from "../../Queries/Generic/GuildSettings";
import { fetchAllGuildMemberResponses } from "../../Queries/Generic/MemberResponses";
import { randomArrayValue } from "../../tools/randomArrayValue";
import { GenericGuild } from "./GenericGuild";


export abstract class AbstractGuild implements GenericGuild {

    private _responses: string[];
    private _settings: guildSettings;
    private _userResponses: memberResponses;
    private _guild: Guild;
    private _logs: string[] = [];

    protected readonly guildID: Snowflake;
    protected specifiedCommands?: Promise<GenericGuildCommand>[];

    protected _genericCommands: Promise<GenericGuildCommand>[] = [
        PollCmdImpl, DmMemberCmdImpl, SetPrefixCmdImpl,
        PinMessageCmdImpl, UnpinMessageCmdImpl,
        MessageChannelCmdImpl, ClearMessagesCmdImpl, EditMessageCmdImpl,
        LockCommandCmdImpl, UnlockCommandCmdImpl, ShowPermsCmdsImpl,
        AddResponseCmdImpl, ShowPersonalResponsesCmdImpl, RemovePersonalResponseCmdImpl,
        NsfwSwitchCmdImpl, ShowLogsCmdImpl, bookmarkCmdImpl
    ].map(cmd => cmd.init())

    commandManager: GuildCommandManager;

    protected constructor(guild_id: Snowflake) {
        this.guildID = guild_id;
    }

    get guild(): Guild {
        return this._guild;
    }

    get userResponses(): memberResponses {
        return this._userResponses;
    }

    get logs(): string[] {
        return this._logs;
    }

    static async init(guild_id: Snowflake): Promise<unknown> { return Promise.resolve() };

    getSettings(): guildSettings {
        return this._settings;
    }

    async onReady(client: Client): Promise<unknown> {
        this._guild = client.guilds.cache.get(this.guildID);
        await this.loadResponses()
        return Promise.resolve(`loaded ${this.guild.name}`);
    }

    onGuildMemberAdd(member: GuildMember): Promise<any> {
        return Promise.resolve(this.addGuildLog(`member ${member.displayName} joined the guild`));

    }

    onGuildMemberRemove(member: GuildMember): Promise<any> {
        return Promise.resolve(this.addGuildLog(`member ${member.displayName} left the guild`));
    }

    onGuildMemberUpdate(oldMember: GuildMember, newMember: GuildMember): Promise<any> {
        return Promise.resolve(`member ${newMember.displayName} updated`);
    }

    onSlashCommand(interaction: CommandInteraction | ContextMenuInteraction): Promise<any> {
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

        //TODO: switch to mention
        if (message.content.match(mentionRegex)) {
            return message.channel.sendTyping()
                .then(() => message.reply(randomArrayValue(this._responses)))
                .catch(err => console.log(err));
        }

        return Promise.resolve(`message received`);
    }

    onMessageDelete(deletedMessage: Message): Promise<any> {
        return Promise.resolve(this.addGuildLog(`deleted a message with id:${deletedMessage.id} in ${deletedMessage.channel.isText?.name}`));
    }

    async onMessageReactionAdd(reaction: MessageReaction, user: User): Promise<unknown> {
        switch (reaction.emoji.name) {
            case "📌": case "📍": {
                let response: string;
                if (!reaction.message.pinnable) {
                    response = `*Missing \`MANAGE_MESSAGES\` permission to pin this message*`;
                }
                else if (reaction.message.pinned) {
                    response = `Message is already pinned`
                }
                else {
                    try {
                        await reaction.message.pin();
                        return
                    } catch (error) {
                        if (error.code === Constants.APIErrors.MAXIMUM_PINS)
                            response = `Maximum Number of pins reached`;
                        else
                            return console.log(error);
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


    addGuildLog(log: string, member_id: Snowflake = null): string {
        this.logs.push(log);
        addLog(this.guildID, log, member_id)
            .catch(er => console.error(er));
        return log;
    }

    setPrefix(newPrefix: string): void {
        this._settings.prefix = newPrefix;
    }

    fetchCommands() {
        //this refreshes every time ⬇
        //return this._commandHandler.fetchGuildCommands(this.guild.commands); 
        return this.guild.commands.fetch();
    }

    async loadResponses() {
        this._settings = await fetchGuildSettings(this.guildID);
        const genericResponses = await genericGuildResponses(this.guildID, this._settings.nsfw_responses);
        const memberResponses: string[] = await fetchAllGuildMemberResponses(this.guildID);
        this._responses = memberResponses.concat(genericResponses);
    }

}