import { APIRole } from "discord-api-types";
import { ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, Collection, GuildMember, Message, PermissionFlagsBits, Role, Snowflake, User } from "discord.js";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { openVoiceCmd } from "../Interf/openVoiceCmd";

export class openVoiceCmdImpl extends AbstractGuildCommand implements openVoiceCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `open-voice`;
    readonly guide = `Unlocks voice for member or role`;
    readonly usage = `${this.keyword} <member | role>`;
    private constructor() { super() }
    static async init(): Promise<openVoiceCmd> {
        const cmd = new openVoiceCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    readonly aliases = this.mergeAliases
        (
            ["open_voice", "unlock_voice", "unlock-voice"], this.keyword
        );
    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'mentionable',
                    description: 'Member or Role to unlock your voice for',
                    type: ApplicationCommandOptionType.Mentionable,
                    required: true
                }
            ]
        }
    }
    async interactiveExecute(interaction: ChatInputCommandInteraction): Promise<unknown> {
        try {
            await interaction.deferReply({ ephemeral: true });
            const requestMember = interaction.guild.members.cache.get(interaction.user.id);
            if (!requestMember.voice.channel)
                return interaction.editReply(`You must be in a voice channel to use this command`);
            const mentionable = interaction.options.getMentionable('mentionable', true);
            const voiceChannel = requestMember.voice.channel;
            if (!voiceChannel.permissionsFor(requestMember).has(PermissionFlagsBits.ManageChannels))
                return interaction.editReply(`You do not have manage permissions for this channel`);
            await voiceChannel.permissionOverwrites.edit(
                (mentionable as Role | APIRole)?.id ?? (mentionable as User | GuildMember)?.id, {
                Connect: true,
                Speak: true,
                Stream: true
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



}