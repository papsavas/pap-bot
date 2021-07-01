import {
    ApplicationCommandData, CommandInteraction, Message,
    MessageActionRow, MessageButton, MessageComponentInteraction,
    Snowflake
} from 'discord.js';
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { nsfwSwitchCmd } from '../Interf/nsfwSwitchCmd';
import { fetchGuildSettings, updateGuildSettings } from '../../../Queries/Generic/GuildSettings';
import { guildMap } from '../../..';
import { fetchCommandID } from '../../../Queries/Generic/Commands';


export class NsfwSwitchCmdImpl extends AbstractGuildCommand implements nsfwSwitchCmd {

    protected _id: Snowflake;
    protected _keyword = `nsfw`;
    protected _guide = `Enables/Disables nsfw responses`;
    protected _usage = `nsfw`;
    private constructor() { super() }

    static async init(): Promise<nsfwSwitchCmd> {
        const cmd = new NsfwSwitchCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['nsfw', 'nsfwswitch'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide
        }
    }

    async interactiveExecute(commandInteraction: CommandInteraction): Promise<any> {
        //TODO: Fix behaviour, after update collector returns an error if time ends
        const oldSettings = await fetchGuildSettings(commandInteraction.guildID);

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton({
                    "customID": "off",
                    "label": "SFW responses",
                    "style": "PRIMARY"
                })
                    .setEmoji("👼"),

                new MessageButton({
                    "customID": "on",
                    "label": "NSFW responses",
                    "style": "DANGER",
                })
                    .setEmoji("🔞")
            );

        await commandInteraction.reply({
            content: `Select accordingly for guild response type`,
            components: [row]
        });
        const filter = (componentInteraction: MessageComponentInteraction) =>
            ['on', 'off'].includes(componentInteraction.customID) &&
            componentInteraction.user.id === commandInteraction.user.id;

        try {
            const btn = await commandInteraction.channel.awaitMessageComponentInteraction
                (
                    { filter, time: 10000 }
                );
            const enabled = btn.customID === 'on';
            const literal = enabled ? "Enabled" : "Disabled";
            await updateGuildSettings(commandInteraction.guildID, Object.assign(oldSettings, { "nsfw_responses": enabled }));
            await guildMap.get(commandInteraction.guildID).loadResponses();
            return commandInteraction.editReply({
                content: `**${literal}** \`nsfw\` mode`,
                components: []
            });
        } catch (error) {
            if (error.name === 'time')
                return commandInteraction.editReply({
                    content: `failed to respond in time`,
                    components: []
                });
        }




    }

    async execute(message: Message, { }: literalCommandType) {
        //TODO: Fix behaviour, after update collector returns an error if time ends
        try {
            const oldSettings = await fetchGuildSettings(message.guild.id);
            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton({
                        "customID": "on",
                        "label": "enable",
                        "style": "DANGER",
                    }).setEmoji("🔞"),
                    new MessageButton({
                        "customID": "off",
                        "label": "disable",
                        "style": "PRIMARY"
                    }).setEmoji("👼")
                );
            const reply = await message.reply({
                content: `Select accordingly for nsfw responses`,
                components: [row]
            });
            const filter = (componentInteraction: MessageComponentInteraction) =>
                ['on', 'off'].includes(componentInteraction.customID) &&
                componentInteraction.user.id === message.author.id;
            const btn = await message.channel.awaitMessageComponentInteraction
                (
                    { filter, time: 10000 }
                );

            if (!btn)
                return reply.edit({
                    content: `failed to respond in time`,
                    components: []
                });
            const enabled = btn.customID === 'on';
            const literal = enabled ? "Enabled" : "Disabled";
            await updateGuildSettings(message.guild.id, Object.assign(oldSettings, { "nsfw_responses": enabled }));
            await guildMap.get(message.guild.id).loadResponses();
            return reply.edit({
                content: `**${literal}** \`nsfw\` mode`,
                components: []
            });
        } catch (error) {
            return Promise.reject(error)
        }

    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}