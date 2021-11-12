import { ApplicationCommandOptionData, Collection, ContextMenuInteraction, Message, MessageApplicationCommandData, MessageEmbed, Snowflake } from "discord.js";
import { guildMap } from "../../..";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { unpinMessageCmd } from "../Interf/unpinMessageCmd";


const msgidOptionLiteral: ApplicationCommandOptionData['name'] = 'message_id';
const reasonOptionLiteral: ApplicationCommandOptionData['name'] = 'reason';

export class UnpinMessageCmdImpl extends AbstractGuildCommand implements unpinMessageCmd {

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `unpin`;
    protected _guide = `Unpins a message`;
    protected _usage = `unpin <msg_id> [reason]`;

    private constructor() { super() }

    static async init(): Promise<unpinMessageCmd> {
        const cmd = new UnpinMessageCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['unpin', 'ανπιν'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): MessageApplicationCommandData {
        return {
            name: this.keyword,
            type: 'MESSAGE'
        }
    }

    async interactiveExecute(interaction: ContextMenuInteraction): Promise<unknown> {
        const msgId = interaction.options.getMessage("message").id;
        const message = await interaction.channel.messages.fetch(msgId);
        if (!message?.pinned)
            return interaction.reply({
                embeds: [new MessageEmbed({ description: `[message](${message.url}) is not pinned 🙂` })],
                ephemeral: true
            })
        else if (!message?.pinnable)
            return interaction.reply({
                content: 'Cannot unpin this message',
                ephemeral: true
            }
            )
        return message.unpin()
            .then((unpinned) => {
                interaction.reply({
                    embeds: [
                        new MessageEmbed({
                            author: {
                                name: interaction.user.username,
                                iconURL: interaction.user.avatarURL()
                            },
                            title: `Unpinned Message  📌`,
                            description: unpinned.content?.length > 0 ?
                                `[${unpinned.content.substring(0, 100)}...](${unpinned.url})` :
                                `[Click to jump](${unpinned.url})`,
                            color: 'RED',
                        })
                    ]
                })
            })
    }

    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        return message.reply(`Use context menu command (right click on message => Apps => ${this.keyword})`)

    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}
