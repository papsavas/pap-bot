
import { ApplicationCommandData, ApplicationCommandOptionData, CommandInteraction, Message, Snowflake } from "discord.js";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildMap } from "../../../index";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { fetchGuildSettings, updateGuildSettings } from "../../../Queries/Generic/GuildSettings";
import { GsetPrefix as _guide } from '../../guides.json';
import { setPrefix as _keyword } from '../../keywords.json';
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { pollCmd } from "../Interf/pollCmd";
import { setPrefixCmd } from "../Interf/setPrefixCmd";

const prefixOptionLiteral: ApplicationCommandOptionData['name'] = 'prefix';
export class SetPrefixCmdImpl extends AbstractGuildCommand implements pollCmd {

    protected _id: Snowflake;
    private constructor() { super() }

    static async init(): Promise<setPrefixCmd> {
        const cmd = new SetPrefixCmdImpl();
        cmd._id = await fetchCommandID(_keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['prefix', 'setprefix'],
            _keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide(),
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
        const guildHandler = guildMap.get(interaction.guildID);
        const newPrefix = interaction.options.get(prefixOptionLiteral)?.value as string;
        await interaction.defer();
        if (!!newPrefix) {
            const oldSettings = await fetchGuildSettings(interaction.guildID);
            const newSettings = Object.assign(oldSettings, { 'prefix': newPrefix });
            await updateGuildSettings(interaction.guildID, newSettings).then(() => guildHandler.setPrefix(newPrefix));
            return interaction.editReply(`new prefix is set to \`${newPrefix}\``)
        }
        else
            return interaction.editReply(`Current prefix is \`${guildHandler.getSettings().prefix}\``);

    }

    execute(receivedMessage: Message, receivedCommand: literalCommandType): Promise<any> {
        const guildHandler = guildMap.get(receivedMessage.guild.id);
        if (receivedCommand.arg1)
            return fetchGuildSettings(receivedMessage.guild.id)
                .then(async oldSettings => {
                    const newSettings = Object.assign(oldSettings, { 'prefix': receivedCommand.arg1 });
                    return updateGuildSettings(receivedMessage.guild.id, newSettings).then(() => guildHandler.setPrefix(receivedCommand.arg1))
                });
        else
            return receivedMessage.reply({
                content: `Current prefix is "${guildHandler.getSettings().prefix}"`,
                code: true
            });

    }

    getKeyword(): string {
        return _keyword
    }

    getAliases(): string[] {
        return this._aliases
    }

    getGuide(): string {
        return _guide;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }

}
