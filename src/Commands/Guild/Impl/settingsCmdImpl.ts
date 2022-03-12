import { ActionRow, ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, ButtonComponent, ButtonInteraction, ButtonStyle, ChannelType, ChatInputCommandInteraction, Collection, GuildChannel, GuildMember, InteractionReplyOptions, Message, MessageComponentInteraction, PermissionFlagsBits, ReplyMessageOptions, Snowflake } from "discord.js";
import { guilds } from "../../..";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { fetchGuildSettings, setVoiceLobby, updateGuildSettings } from "../../../Queries/Generic/GuildSettings";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { settingsCmd } from "../Interf/settingsCmd";

const [nsfwLiteral, lobbyLiteral, prefixLiteral] = ["nsfw", "voice-lobby", "prefix"];
const [voiceOptLiteral, newPrefixOptLiteral] = ["voice_channel", "new_prefix"]

export class settingsCmdImpl extends AbstractGuildCommand implements settingsCmd {
    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `settings`;
    readonly guide = `edits guild settings`;
    readonly usage = `${this.keyword} nsfw | voice-lobby <channel_id> | prefix [new_prefix]`;
    private constructor() { super() }
    static async init(): Promise<settingsCmd> {
        const cmd = new settingsCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    readonly aliases = this.mergeAliases
        (
            [], this.keyword
        );
    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: nsfwLiteral,
                    description: "Enables/Disables nsfw responses",
                    type: ApplicationCommandOptionType.Subcommand
                },
                {
                    name: lobbyLiteral,
                    description: "Sets the voice lobby channel",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: voiceOptLiteral,
                            description: "VC acting as lobby",
                            type: ApplicationCommandOptionType.Channel,
                            channelTypes: [ChannelType.GuildVoice],
                            required: true
                        }
                    ]
                },
                {
                    name: prefixLiteral,
                    description: "Displays-sets bot prefix",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: newPrefixOptLiteral,
                            description: 'new prefix',
                            type: ApplicationCommandOptionType.String,
                            required: false
                        }
                    ]
                }
            ]
        }
    }

    async interactiveExecute(interaction: ChatInputCommandInteraction): Promise<unknown> {
        const subcommand = interaction.options.getSubcommand(true);
        await interaction.deferReply({ ephemeral: true });
        const args = {};
        [voiceOptLiteral, newPrefixOptLiteral]
            .forEach(s => args[s] = interaction.options.get(s)?.value);
        return this.coreHandler(subcommand, interaction, args);
    }

    async execute(message: Message, { arg1, arg2 }: commandLiteral): Promise<unknown> {
        const subcommand = arg1;
        const args = {};
        //TODO: fix cloned invalid args
        [voiceOptLiteral, newPrefixOptLiteral]
            .forEach(s => args[s] = arg2);
        return this.coreHandler(subcommand, message, args);
    }





    private coreHandler = async (
        subcommand: string,
        source: ChatInputCommandInteraction | Message,
        args: { [key: string]: string | GuildChannel } = {}
    ) => {
        const member = await source.guild.members.fetch(source.member.user.id);
        if (!member.permissions.has(PermissionFlagsBits.ManageGuild))
            return this.respond(source, { content: "`MANAGE_GUILD` permissions needed", ephemeral: true });
        switch (subcommand) {
            case nsfwLiteral:
                return this.nsfwHandler(
                    source,
                    (resp) => this.respond(source, resp)
                );

            case lobbyLiteral:
                return this.lobbyHandler(
                    source,
                    (resp) => this.respond(source, resp),
                    args[voiceOptLiteral] as GuildChannel
                )
            case prefixLiteral:
                return this.prefixHandler(
                    source,
                    (resp) => this.respond(source, resp),
                    args[newPrefixOptLiteral] as string

                );
        }
    }

    private prefixHandler = async (
        source: ChatInputCommandInteraction | Message,
        respond: (res: ReplyMessageOptions | InteractionReplyOptions) => Promise<unknown>,
        newPrefix?: string
    ) => {
        const guildHandler = guilds.get(source.guildId);
        if (!!newPrefix) {
            const member = source.member instanceof GuildMember ?
                source.member : await source.guild.members.fetch(source.member.user.id);
            if (!member.permissions.has(PermissionFlagsBits.ManageGuild))
                return respond({ content: "`MANAGE_GUILD` permissions required", ephemeral: true });
            const oldSettings = await fetchGuildSettings(source.guildId);
            const newSettings = ({ ...oldSettings, 'prefix': newPrefix });
            await updateGuildSettings(source.guildId, newSettings).then(() => guildHandler.setPrefix(newPrefix));
            return respond({ content: `new prefix is set to \`${newPrefix}\`` })
        }
        else
            return respond({ content: `Current prefix is \`${guildHandler.getSettings().prefix}\``, ephemeral: true });
    }

    private lobbyHandler = async (
        source: ChatInputCommandInteraction | Message,
        respond: (res: ReplyMessageOptions | InteractionReplyOptions) => Promise<unknown>,
        voice: GuildChannel
    ) => {

        if (!(await source.guild.members.fetch(source.member.user.id)).permissions.has(PermissionFlagsBits.ManageGuild))
            return respond({ content: "`MANAGE_GUILD` permissions required" })
        if (!voice.isVoice()) {
            return respond({ content: "Please provide a voice channel" });
        }
        await setVoiceLobby(source.guildId, voice.id);
        return respond({ content: `Voice ${voice.toString()} is now set as creation lobby` });
    }

    private nsfwHandler = async (
        source: ChatInputCommandInteraction | Message,
        respond: (res: ReplyMessageOptions | InteractionReplyOptions) => Promise<unknown>,
    ) => {
        const member = await source.guild.members.fetch(source.member.user.id);
        const perm = PermissionFlagsBits.ManageGuild;
        if (!member.permissions.has(perm))
            return respond({
                content: `\`MANAGE_GUILD\` Permissions required`,
                ephemeral: true
            })
        //TODO: Fix behavior, after update collector returns an error if time ends
        const oldSettings = await fetchGuildSettings(source.guildId);

        const row = new ActionRow()
            .addComponents(
                new ButtonComponent({
                    customId: "off",
                    label: "SFW responses",
                    style: ButtonStyle.Primary
                })
                    .setEmoji({ name: "👼" }),

                new ButtonComponent({
                    customId: "on",
                    label: "NSFW responses",
                    style: ButtonStyle.Danger,
                })
                    .setEmoji({ name: "🔞" })
            );

        await respond({
            content: `Select accordingly for guild response type`,
            components: [row]
        });
        const filter = (componentInteraction: MessageComponentInteraction) =>
            ['on', 'off'].includes(componentInteraction.customId) &&
            componentInteraction.user.id === source.member.user.id;

        try {
            const btn = await source.channel.awaitMessageComponent
                (
                    { filter, time: 10000 }
                );
            const enabled = (btn as ButtonInteraction).customId === 'on';
            const literal = enabled ? "Enabled" : "Disabled";
            await updateGuildSettings(source.guildId, { ...oldSettings, "nsfw_responses": enabled });
            await guilds.get(source.guildId).loadResponses();
            return respond({
                content: `**${literal}** \`nsfw\` mode`,
                components: []
            });
        } catch (error) {
            if (error.name === 'time')
                return respond({
                    content: `failed to respond in time`,
                    components: []
                });
        }
    }
}

