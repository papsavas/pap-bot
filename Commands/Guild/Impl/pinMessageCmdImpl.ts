import { GpinMessage as _guide } from "../../guides.json";
import { pinMessage as _keyword } from "../../keywords.json";

import { pinMessageCmd } from "../Interf/pinMessageCmd";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { extractId } from "../../../toolbox/extractMessageId";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import { ApplicationCommandData, CommandInteraction, DiscordAPIError, GuildMember, Message, MessageEmbed, Snowflake, TextChannel } from "discord.js";
import * as e from '../../../errorCodes.json';
import { guildMap } from "../../..";
import { fetchCommandID } from "../../../Queries/Generic/Commands";



export class PinMessageCmdImpl extends AbstractGuildCommand implements pinMessageCmd {

    readonly id: Snowflake = fetchCommandID(_keyword);

    private readonly _aliases = this.addKeywordToAliases
        (
            ['pin', 'πιν'],
            _keyword
        );

    getCommandData(): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide(),
            options: [
                {
                    name: 'message_id',
                    description: 'targeted message id or link',
                    type: 'STRING',
                    required: true
                },
                {
                    name: 'reason',
                    description: 'reason for pinning',
                    type: 'STRING',
                    required: false
                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const channel = interaction.channel as TextChannel;
        const reason = interaction.options[1];
        const member = interaction.member as GuildMember
        let pinReason = reason ? reason.value as string : ``;
        pinReason += `\nby ${member.displayName}`;
        let pinningMessageID = extractId(interaction.options[0].value as string);
        let fetchedMessage: Message;
        try {
            fetchedMessage = await channel.messages.fetch(pinningMessageID);
            if (fetchedMessage.pinned)
                return interaction.reply({
                    embeds: [{ description: `[message](${fetchedMessage.url}) already pinned 😉` }],
                    ephemeral: true
                });
            return fetchedMessage.pin()
                .then((pinnedMessage) => {
                    this.addGuildLog(interaction.guildID, `message pinned:\n${pinnedMessage.url} with reason ${pinReason}`);
                    interaction.reply(new MessageEmbed({
                        title: `Pinned Message 📌`,
                        description: pinnedMessage.content?.length > 0 ?
                            `[${pinnedMessage.content.substring(0, 100)}...](${pinnedMessage.url})` :
                            `[Click to jump](${pinnedMessage.url})`,
                        footer: { text: pinReason }
                    }))
                })
                .catch(err => {
                    interaction.reply('could not pin message');
                });
        } catch (error) {
            if (error.code == e["Unknown message"])
                return interaction.reply(`*invalid message id. Message needs to be of channel ${channel.toString()}*`,
                    { ephemeral: true })
        }
    }

    async execute(message: Message, { arg1, commandless2 }: literalCommandType): Promise<any> {
        const channel = message.channel;
        let pinReason = commandless2 ? commandless2 : ``;
        pinReason += `\nby ${message.member.displayName}`;
        let pinningMessageID = extractId(arg1);
        let fetchedMessage;
        try {
            fetchedMessage = await channel.messages.fetch(pinningMessageID);
        } catch (error) {
            if (error.code == e["Unknown message"])
                return message.reply(`*invalid message id. Message needs to be of channel ${channel.toString()}*`);
        }
        if (fetchedMessage.pinned)
            return message.reply({ embed: { description: `[message](${fetchedMessage.url}) already pinned 😉` } });

        return channel.messages.fetch(pinningMessageID)
            .then((fetchedMessage) => {
                fetchedMessage.pin()
                    .then((pinnedMessage) => {
                        this.addGuildLog(message.guild.id, `message pinned:\n${pinnedMessage.url} with reason ${pinReason}`);
                        if (message.deletable)
                            message.client.setTimeout(() => message.delete().catch(), 3000);
                    });
            })
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
