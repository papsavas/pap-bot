import { APIRole } from "discord-api-types";
import { ApplicationCommandData, Collection, CommandInteraction, GuildMember, Message, Role, Snowflake, User } from "discord.js";
import { guildMap } from "../../..";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { openVoiceCmd } from "../Interf/openVoiceCmd";

export class openVoiceCmdImpl extends AbstractGuildCommand implements openVoiceCmd {

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `open-voice`;
    protected _guide = `Unlocks voice for member or role`;
    protected _usage = `${this.keyword} <member | role>`;
    private constructor() { super() }
    static async init(): Promise<openVoiceCmd> {
        const cmd = new openVoiceCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    private readonly _aliases = this.addKeywordToAliases
        (
            ["open_voice", "unlock_voice", "unlock-voice"], this.keyword
        );
    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: 'mentionable',
                    description: 'Member or Role to unlock your voice for',
                    type: 'MENTIONABLE',
                    required: true
                }
            ]
        }
    }
    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
        try {
            await interaction.deferReply({ ephemeral: true });
            const requestMember = interaction.guild.members.cache.get(interaction.user.id);
            if (!requestMember.voice.channel)
                return interaction.editReply(`You must be in a voice channel to use this command`);
            const mentionable = interaction.options.getMentionable('mentionable', true);
            const voiceChannel = requestMember.voice.channel;
            if (!voiceChannel.permissionsFor(requestMember).has('MANAGE_CHANNELS'))
                return interaction.editReply(`You do not have manage permissions for this channel`);
            await voiceChannel.permissionOverwrites.edit(
                (mentionable as Role | APIRole)?.id ?? (mentionable as User | GuildMember)?.id, {
                CONNECT: true,
                SPEAK: true,
                STREAM: true
            })
            return interaction.editReply(`Channel ${voiceChannel.toString()} is now unlocked for ${mentionable.toString()}`)
        }
        catch (err) {
            return interaction.editReply(`Error: ${err.toString()}`);
        }

    }

    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        return message.reply(`Please use slash command => \`/${this.usage}\``);
    }

    getAliases(): string[] {
        return this._aliases;
    }
    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}