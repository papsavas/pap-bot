
import { ApplicationCommandOptionData, ChatInputApplicationCommandData, CommandInteraction, Message, Permissions, Snowflake } from "discord.js";
import { commandLiteral } from "../../../Entities/Generic/command";
import { guildMap } from "../../../index";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { fetchGuildSettings, updateGuildSettings } from "../../../Queries/Generic/GuildSettings";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { pollCmd } from "../Interf/pollCmd";
import { setPrefixCmd } from "../Interf/setPrefixCmd";

const prefixOptionLiteral: ApplicationCommandOptionData['name'] = 'prefix';
export class SetPrefixCmdImpl extends AbstractGuildCommand implements pollCmd {

    protected _id: Snowflake;
    protected _keyword = `setprefix`;
    protected _guide = `Changes the prefix of the bot`;
    protected _usage = `prefix [new_prefix]`;

    private constructor() { super() }

    static async init(): Promise<setPrefixCmd> {
        const cmd = new SetPrefixCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['prefix', 'setprefix'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: prefixOptionLiteral,
                    description: 'new prefix',
                    type: 'STRING',
                    required: false
                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
            return interaction.reply(`\`MANAGE_GUILD\` permissions required`);
        const guildHandler = guildMap.get(interaction.guildId);
        const newPrefix = interaction.options.getString(prefixOptionLiteral);
        await interaction.deferReply();
        if (!!newPrefix) {
            const oldSettings = await fetchGuildSettings(interaction.guildId);
            const newSettings = Object.assign(oldSettings, { 'prefix': newPrefix });
            await updateGuildSettings(interaction.guildId, newSettings).then(() => guildHandler.setPrefix(newPrefix));
            return interaction.editReply(`new prefix is set to \`${newPrefix}\``)
        }
        else
            return interaction.editReply(`Current prefix is \`${guildHandler.getSettings().prefix}\``);

    }

    execute(message: Message, receivedCommand: commandLiteral): Promise<any> {
        if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_GUILD))
            return message.reply(`\`MANAGE_GUILD\` permissions required`);
        const guildHandler = guildMap.get(message.guild.id);
        if (receivedCommand.arg1)
            return fetchGuildSettings(message.guild.id)
                .then(async oldSettings => {
                    const newSettings = Object.assign(oldSettings, { 'prefix': receivedCommand.arg1 });
                    return updateGuildSettings(message.guild.id, newSettings).then(() => guildHandler.setPrefix(receivedCommand.arg1))
                });
        else
            return message.reply({
                content: `\`\`\`Current prefix is "${guildHandler.getSettings().prefix}"\`\`\``
            });

    }
    getAliases(): string[] {
        return this._aliases
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }

}
