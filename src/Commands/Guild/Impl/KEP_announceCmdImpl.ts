
import { ActionRow, ApplicationCommandOptionType, ApplicationCommandType, ButtonComponent, ButtonStyle, ChatInputApplicationCommandData, ChatInputCommandInteraction, Collection, Embed, Message, Snowflake, TextChannel } from "discord.js";
import { channels as kepChannels } from "../../../../values/KEP/IDs.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from '../../../Queries/Generic/Commands';
import { AbstractGuildCommand } from '../AbstractGuildCommand';
import { KEP_announceCmd } from "../Interf/KEP_announceCmd";

const contentLiteral = `content`
export class KEP_announceCmdImpl extends AbstractGuildCommand implements KEP_announceCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `announce`;
    readonly guide = `Ανακοινώνει ένα μήνυμα στα νέα-ενημερώσεις`;
    readonly usage = `${this.keyword} <message> [<roles>]`;
    private constructor() {
        super()
    }

    static async init(): Promise<KEP_announceCmd> {
        const cmd = new KEP_announceCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    readonly aliases = this.mergeAliases
        (
            ['announce', 'ann'], this.keyword
        );

    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: contentLiteral,
                    description: `Μήνυμα προς ανακοίνωση`,
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: `role1`,
                    description: `Ρόλος προς ειδοποίηση`,
                    type: ApplicationCommandOptionType.Role,
                    required: false
                },
                {
                    name: `role2`,
                    description: `Ρόλος προς ειδοποίηση`,
                    type: ApplicationCommandOptionType.Role,
                    required: false
                },
                {
                    name: `role3`,
                    description: `Ρόλος προς ειδοποίηση`,
                    type: ApplicationCommandOptionType.Role,
                    required: false
                }
            ]
        };
    }

    //convert to ModalInteraction
    async interactiveExecute(interaction: ChatInputCommandInteraction): Promise<void> {
        const literal = (interaction.options.getString(contentLiteral, true)).substring(0, 2000);
        const roles = ["1", "2", "3"]
            .map((n, i) => interaction.options.getRole(`role${n}`, i === 0))
            .filter(r => typeof r !== "undefined");
        const newsChannel = interaction.guild.channels.cache.get(kepChannels.news as Snowflake) as TextChannel;
        const emb = new Embed({
            author: {
                name: interaction.user.tag,
                iconURL: interaction.user.defaultAvatarURL
            },
            title: `Μήνυμα προς ανακοίνωση`,
            description: literal,
            fields: [
                { name: `Roles to ping`, value: roles.length > 0 ? roles.toString() : `None` }
            ]

        })
        await interaction.reply({
            content: `Το μήνυμα σας υποβλήθηκε και αναμένει έγκριση`,
            embeds: [emb],
            ephemeral: true
        });

        const modChannel = interaction.guild.channels.cache.get(kepChannels.mods as Snowflake) as TextChannel;
        const approveLiteral = 'approve';
        const approveBtn = new ButtonComponent()
            .setCustomId(approveLiteral)
            .setEmoji({ name: '✅' })
            .setStyle(ButtonStyle.Success);
        const rejectBtn = new ButtonComponent()
            .setCustomId('reject')
            .setEmoji({ name: '❌' })
            .setStyle(ButtonStyle.Danger);

        const modMsg = await modChannel.send({
            content: `ενημέρωση προς έγκριση`,
            embeds: [emb],
            components: [
                new ActionRow()
                    .addComponents(approveBtn, rejectBtn)
            ]
        });

        const response = await modMsg.awaitMessageComponent({ filter: btnInt => !btnInt.user.bot });
        if (response.customId === approveLiteral) {
            await newsChannel.send(`${roles.length > 0 ? roles.toString() + '\n' + literal : literal}`);
            await response.update({
                content: `Εγκρίθηκε από ${response.user.tag}`,
                embeds: [emb],
                components: [new ActionRow().addComponents(approveBtn.setDisabled(true))]
            });
        }
        else
            await response.update({
                content: `Απορρίφθηκε από **${response.user.tag}**`,
                embeds: [emb],
                components: [new ActionRow().addComponents(rejectBtn.setDisabled(true))]
            });

    }

    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        return message.reply(`Χρησιμοποιείτε την εντολή ως slash command \`/${this.keyword}\` ώστε να μπορείτε να δηλώσετε και ρόλους για ping`);
    }



}