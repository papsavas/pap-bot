import { ApplicationCommandData, Collection, CommandInteraction, Message, Snowflake } from "discord.js";
import { guildMap } from "../../..";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { setVoiceLobby } from "../../../Queries/Generic/GuildSettings";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { setVoiceLobbyCmd } from "../Interf/setVoiceLobbyCmd";

export class setVoiceLobbyCmdImpl extends AbstractGuildCommand implements setVoiceLobbyCmd {

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `setVoiceLobby`;
    protected _guide = `Sets a voice channel as Creation Lobby`;
    protected _usage = `setVoiceLobby <voiceChannel>`;

    private constructor() { super() }

    static async init(): Promise<setVoiceLobbyCmd> {
        const cmd = new setVoiceLobbyCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    private readonly _aliases = this.addKeywordToAliases
        (
            ["set_voice_lobby", "voice_lobby", "voiceLobby"], this.keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: "voice",
                    description: "The voice you want to act as a lobby",
                    type: "CHANNEL",
                    required: true
                }
            ]
        }
    }
    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
        await interaction.deferReply({ ephemeral: true });
        if (!(await interaction.guild.members.fetch(interaction.user.id)).permissions.has('MANAGE_GUILD'))
            return interaction.editReply("`MANAGE_GUILD` permissions required")
        const voice = interaction.options.getChannel("voice", true);
        if (voice.type !== "GUILD_VOICE") {
            return interaction.editReply("Please provide a voice channel");
        }
        return setVoiceLobby(interaction.guildId, voice.id)
    }

    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        return message.reply("Please use slash command");
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}