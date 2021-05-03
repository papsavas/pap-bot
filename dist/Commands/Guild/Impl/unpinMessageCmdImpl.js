"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnpinMessageCmdImpl = void 0;
const guides_json_1 = require("../../guides.json");
const keywords_json_1 = require("../../keywords.json");
const Discord = require("discord.js");
const Inversify_1 = require("Inversify");
const AbstractCommand_1 = require("../AbstractCommand");
const toolbox_1 = require("../../../toolbox/toolbox");
const e = require("../../../errorCodes.json");
Inversify_1.injectable();
class UnpinMessageCmdImpl extends AbstractCommand_1.AbstractCommand {
    constructor() {
        super(...arguments);
        this._aliases = this.addKeywordToAliases(['unpin', 'ανπιν'], keywords_json_1.unpinMessage);
    }
    getCommandData() {
        return {
            name: keywords_json_1.unpinMessage,
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
                    description: 'reason for unpinning',
                    type: 'STRING',
                    required: false
                }
            ]
        };
    }
    async interactiveExecute(interaction) {
        const channel = interaction.channel;
        const reason = interaction.options[1];
        const member = interaction.member;
        let unpinReason = reason ? reason.value : ``;
        unpinReason += `\nby ${member?.displayName}`;
        let pinningMessageID = toolbox_1.extractId(interaction.options[0].value);
        let fetchedMessage;
        try {
            fetchedMessage = await channel.messages.fetch(pinningMessageID);
        }
        catch (error) {
            if (error.code == e["Unknown message"])
                return interaction.reply(`*invalid message id. Message needs to be of channel ${channel.toString()}*`, { ephemeral: true });
        }
        return fetchedMessage.unpin({ reason: unpinReason })
            .then((unpinnedMessage) => {
            //addGuildLog(`message pinned:\n${pinnedMessage.url} with reason ${pinReason}`);
            interaction.reply(new Discord.MessageEmbed({
                title: `Unpinned Message 📌`,
                description: unpinnedMessage.content?.length > 0 ?
                    `[${unpinnedMessage.content.substring(0, 40)}...](${unpinnedMessage.url})` :
                    `[Click to jump](${unpinnedMessage.url})`,
                footer: { text: unpinReason }
            }));
        })
            .catch(err => {
            interaction.reply('could not pin message');
        });
    }
    execute(message, { arg1, commandless2 }, addGuildLog) {
        const [channel, member] = [message.channel, message.member];
        let unpinReason = commandless2 ? commandless2 : `undefined`;
        unpinReason += `\nby ${member.displayName}`;
        let id = toolbox_1.extractId(arg1);
        return channel.messages.fetch(id)
            .then((msg) => {
            msg.unpin({ reason: unpinReason })
                .then((msg) => {
                //addGuildLog(`message unpinned:\n${msg.url} with reason ${unpinReason}`);
                if (message.deletable)
                    message.client.setTimeout(() => message.delete().catch(), 3000);
            });
        });
    }
    getAliases() {
        return this._aliases;
    }
    getGuide() {
        return guides_json_1.GunpinMessage;
    }
    getKeyword() {
        return keywords_json_1.unpinMessage;
    }
}
exports.UnpinMessageCmdImpl = UnpinMessageCmdImpl;
