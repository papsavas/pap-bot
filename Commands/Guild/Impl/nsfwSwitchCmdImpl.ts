import { ApplicationCommandData, CommandInteraction, Message, MessageActionRow, MessageButton, MessageComponentInteraction, Snowflake } from 'discord.js';
import { nsfwSwitch as _keyword } from '../../keywords.json';
import { GnsfwSwitch as _guide } from '../../guides.json';

import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import { nsfwSwitchCmd } from '../Interf/nsfwSwitchCmd';
import { fetchGuildSettings, updateGuildSettings } from '../../../Queries/Generic/GuildSettings';
import { guildMap } from '../../..';
import { fetchCommandID } from '../../../Queries/Generic/Commands';


export class NsfwSwitchCmdImpl extends AbstractGuildCommand implements nsfwSwitchCmd {

    protected _id: Snowflake;
    private constructor() { super() }

    static async init(): Promise<nsfwSwitchCmd> {
        const cmd = new NsfwSwitchCmdImpl();
        cmd._id = await fetchCommandID(_keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['nsfw', 'nsfwswitch'],
            _keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide()
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const oldSettings = await fetchGuildSettings(interaction.guildID);

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton({
                    "customID": "on",
                    "label": "enable",
                    "style": "SUCCESS"
                }),
                new MessageButton({
                    "customID": "off",
                    "label": "disable",
                    "style": "DANGER"
                })
            );

        await interaction.reply(`Select accordingly for nsfw responses`, { components: [row] });
        const filter = (componentInteraction: MessageComponentInteraction) =>
            ['on', 'off'].includes(componentInteraction.customID) &&
            interaction.user.id === interaction.user.id;
        const collected = await interaction.channel.awaitMessageComponentInteractions
            (
                filter, { time: 10000, max: 1 }
            );

        const btn = collected.first();
        if (!btn)
            return interaction.editReply(`failed to respond in time`, { components: [] });
        const enabled = btn.customID === 'on';
        const literal = enabled ? "Enabled" : "Disabled";
        await updateGuildSettings(interaction.guildID, Object.assign(oldSettings, { "nsfw_responses": enabled }));
        await guildMap.get(interaction.guildID).loadResponses();
        return interaction.editReply(`**${literal}** \`nsfw\` mode`, { components: [] });
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