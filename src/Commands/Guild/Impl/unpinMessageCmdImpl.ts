import { Collection, ContextMenuInteraction, Message, MessageApplicationCommandData, MessageEmbed, Snowflake } from "discord.js";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { unpinMessageCmd } from "../Interf/unpinMessageCmd";

export class UnpinMessageCmdImpl extends AbstractGuildCommand implements unpinMessageCmd {

    protected _id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `unpin`;
    readonly guide = `Unpins a message`;
    readonly usage = `Right click on message => Apps => ${this.keyword}`;

    private constructor() { super() }

    static async init(): Promise<unpinMessageCmd> {
        const cmd = new UnpinMessageCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    readonly aliases = this.mergeAliases
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
        return message.reply(`Use context menu command (${this.usage})`);

    }




}
