import { ApplicationCommandType, Collection, Colors, ContextMenuCommandInteraction, Embed, Message, MessageApplicationCommandData, Snowflake } from "discord.js";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { pinMessageCmd } from "../../Guild/Interf/pinMessageCmd";
import { AbstractGuildCommand } from "../AbstractGuildCommand";

export class PinMessageCmdImpl extends AbstractGuildCommand implements pinMessageCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `pin`;
    readonly guide = `Pins a message`;
    readonly usage = `Right click on message => Apps => ${this.keyword}`;
    private constructor() { super() }

    static async init(): Promise<pinMessageCmd> {
        const cmd = new PinMessageCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    readonly aliases = this.mergeAliases
        (
            ['pin', 'πιν'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): MessageApplicationCommandData {
        return {
            name: this.keyword,
            type: ApplicationCommandType.Message
        }
    }

    async interactiveExecute(interaction: ContextMenuCommandInteraction): Promise<unknown> {
        const msgId = interaction.options.getMessage("message").id;
        const message = await interaction.channel.messages.fetch(msgId);
        if (message?.pinned)
            return interaction.reply({
                embeds: [new Embed({ description: `[message](${message.url}) already pinned 😉` })],
                ephemeral: true
            })
        else if (!message?.pinnable)
            return interaction.reply({
                content: 'Cannot pin this message',
                ephemeral: true
            }
            )
        return message.pin()
            .then((pinnedMessage) => {
                interaction.reply({
                    embeds: [
                        new Embed({
                            author: {
                                name: interaction.user.username,
                                iconURL: interaction.user.avatarURL()
                            },
                            title: `Pinned Message  📌`,
                            description: pinnedMessage.content?.length > 0 ?
                                `[${pinnedMessage.content.substring(0, 100)}...](${pinnedMessage.url})` :
                                `[Click to jump](${pinnedMessage.url})`,
                            color: Colors.Green,
                        })
                    ]
                })
            })
    }

    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        return message.reply(`Use context menu command (${this.usage})`);

    }





}
