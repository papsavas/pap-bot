import { ApplicationCommandData, CommandInteraction, Message, Snowflake } from 'discord.js';
import { nsfwSwitch as _keyword } from '../../keywords.json';
import { GnsfwSwitch as _guide } from '../../guides.json';

import { AbstractCommand } from "../AbstractCommand";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import { nsfwSwitchCmd } from '../Interf/nsfwSwitchCmd';
import { fetchGuildSettings, updateGuildSettings } from '../../../Queries/Generic/GuildSettings';
import { guildMap } from '../../..';
import { fetchCommandID } from '../../../Queries/Generic/Commands';


export class NsfwSwitchCmdImpl extends AbstractCommand implements nsfwSwitchCmd {

    readonly id: Snowflake = fetchCommandID(_keyword);

    private readonly _aliases = this.addKeywordToAliases
        (
            ['nsfw', 'nsfwswitch'],
            _keyword
        );

    getCommandData(): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide()
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const oldSettings = await fetchGuildSettings(interaction.guildID);
        const literal = oldSettings.nsfw_responses ? "Disabled" : "Enabled"
        await interaction.defer();
        await updateGuildSettings(interaction.guildID, Object.assign(oldSettings, { "nsfw_responses": !oldSettings.nsfw_responses }));
        await guildMap.get(interaction.guildID).loadResponses();
        return interaction.editReply(`**${literal}** \`nsfw\` mode`);
    }

    async execute(message: Message, { }: literalCommandType) {
        try {
            const oldSettings = await fetchGuildSettings(message.guild.id);
            const literal = oldSettings.nsfw_responses ? "Disabled" : "Enabled"
            await message.reply(`**${literal}** \`nsfw\` mode`);
            await updateGuildSettings(message.guild.id, Object.assign(oldSettings, { "nsfw_responses": !oldSettings.nsfw_responses }));
            await guildMap.get(message.guild.id).loadResponses();
            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error)
        }

    }

    getAliases(): string[] {
        return this._aliases;
    }

    getGuide(): string {
        return _guide;
    }

    getKeyword(): string {
        return _keyword;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}