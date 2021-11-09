import { ApplicationCommandData, BaseCommandInteraction, ButtonInteraction, Collection, CommandInteraction, GuildChannel, GuildMember, InteractionReplyOptions, Message, MessageActionRow, MessageButton, MessageComponentInteraction, Permissions, ReplyMessageOptions, Snowflake } from "discord.js";
import { guildMap } from "../../..";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { fetchGuildSettings, setVoiceLobby, updateGuildSettings } from "../../../Queries/Generic/GuildSettings";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { settingsCmd } from "../Interf/settingsCmd";

const [nsfwLiteral, lobbyLiteral, prefixLiteral] = ["nsfw", "voice-lobby", "prefix"];
const [voiceOptLiteral, newPrefixOptLiteral] = ["voice_channel", "new_prefix"]

export class settingsCmdImpl extends AbstractGuildCommand implements settingsCmd {
    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `settings`;
    protected _guide = `edits guild settings`;
    protected _usage = `${this.keyword} nsfw | voice-lobby <channel_id> | prefix [new_prefix]`;
    private constructor() { super() }
    static async init(): Promise<settingsCmd> {
        const cmd = new settingsCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    private readonly _aliases = this.addKeywordToAliases
        (
            [], this.keyword
        );
    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: nsfwLiteral,
                    description: "Enables/Disables nsfw responses",
                    type: "SUB_COMMAND"
                },
                {
                    name: lobbyLiteral,
                    description: "Sets the voice lobby channel",
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: voiceOptLiteral,
                            description: "VC acting as lobby",
                            type: "CHANNEL",
                            channelTypes: ["GUILD_VOICE"],
                            required: true
                        }
                    ]
                },
                {
                    name: prefixLiteral,
                    description: "Displays-sets bot prefix",
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: newPrefixOptLiteral,
                            description: 'new prefix',
                            type: 'STRING',
                            required: false
                        }
                    ]
                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
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

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }

    private coreHandler = async (
        subcommand: string,
        source: BaseCommandInteraction | Message,
        args: { [key: string]: string | GuildChannel } = {}
    ) => {
        const member = await source.guild.members.fetch(source.member.user.id);
        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
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
        source: BaseCommandInteraction | Message,
        respond: (res: ReplyMessageOptions | InteractionReplyOptions) => Promise<void>,
        newPrefix?: string
    ) => {
        const guildHandler = guildMap.get(source.guildId);
        if (!!newPrefix) {
            const member = source.member instanceof GuildMember ?
                source.member : await source.guild.members.fetch(source.member.user.id);
            if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
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
        source: BaseCommandInteraction | Message,
        respond: (res: ReplyMessageOptions | InteractionReplyOptions) => Promise<void>,
        voice: GuildChannel
    ) => {

        if (!(await source.guild.members.fetch(source.member.user.id)).permissions.has('MANAGE_GUILD'))
            return respond({ content: "`MANAGE_GUILD` permissions required" })
        if (voice.type !== "GUILD_VOICE") {
            return respond({ content: "Please provide a voice channel" });
        }
        await setVoiceLobby(source.guildId, voice.id);
        return respond({ content: `Voice ${voice.toString()} is now set as creation lobby` });
    }

    private nsfwHandler = async (
        source: BaseCommandInteraction | Message,
        respond: (res: ReplyMessageOptions | InteractionReplyOptions) => Promise<void>,
    ) => {
        const member = await source.guild.members.fetch(source.member.user.id);
        const perm = Permissions.FLAGS.MANAGE_GUILD;
        if (!member.permissions.has(perm))
            return respond({
                content: `\`MANAGE_GUILD\` Permissions required`,
                ephemeral: true
            })
        //TODO: Fix behavior, after update collector returns an error if time ends
        const oldSettings = await fetchGuildSettings(source.guildId);

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton({
                    "customId": "off",
                    "label": "SFW responses",
                    "style": "PRIMARY"
                })
                    .setEmoji("👼"),

                new MessageButton({
                    "customId": "on",
                    "label": "NSFW responses",
                    "style": "DANGER",
                })
                    .setEmoji("🔞")
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
            await guildMap.get(source.guildId).loadResponses();
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

