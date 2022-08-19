import { BaseCommandInteraction, Collection, Constants, ContextMenuInteraction, Embed, Message, MessageApplicationCommandData, Snowflake, User } from "discord.js";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { bookmarkCmd } from "../Interf/bookmarkCmd";

export class bookmarkCmdImpl extends AbstractGuildCommand implements bookmarkCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `bookmark`;
    readonly guide = null;
    readonly usage = null;

    private constructor() { super() }

    static async init(): Promise<bookmarkCmd> {
        const cmd = new bookmarkCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    readonly aliases = this.mergeAliases
        (
            ['bookmark', 'bm'], this.keyword
        );

    getCommandData(guild_id: Snowflake): MessageApplicationCommandData {
        return {
            name: this.keyword,
            type: 'MESSAGE'
        }
    }

    async interactiveExecute(interaction: ContextMenuInteraction): Promise<unknown> {
        await interaction.deferReply({ ephemeral: true })
        return this.handler(interaction, interaction.targetId);

    }

    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        return this.handler(message, message.id);
    }

    async handler(source: Message | BaseCommandInteraction, msgId: Snowflake) {
        const message = await source.channel.messages.fetch(msgId)
        const user = source instanceof Message ? source.author : source.user;
        let response: string;
        try {
            await messageUser(user, message);
            response = 'check your DMs'
        } catch (error) {
            if (error.code === Constants.APIErrors.CANNOT_MESSAGE_USER)
                response = "Your DMs are closed, i cannot message you"
            else
                response = error.message
        }
        finally {
            return this.respond(source, { content: response });
        }
    }
}



function messageUser(user: User, message: Message) {
    return user.send({
        embeds: [
            new Embed({
                author: {
                    name: message.author.tag,
                    icon_url: message.author.avatarURL({ format: 'png' })
                },
                thumbnail: {
                    url: message.guild.iconURL({ format: 'png', size: 256 })
                },
                title: `🔖 Message Bookmark`,
                description: `from ${message.channel.toString()} [${message.guild.name}]\n
[${message.content.length > 1 ? message.content.substr(0, 500) + "..." : `Jump`}](${message.url})`,
                color: `#fe85a6`,
                image: { url: message.attachments.first()?.url },
                timestamp: new Date(),
            }), ...message.embeds.map(emb => new Embed(emb))
        ]
    })
}