
import { ChatInputApplicationCommandData, Collection, CommandInteraction, Message, MessageActionRow, MessageButton, MessageEmbed, Snowflake, TextChannel } from "discord.js";
import { channels as kepChannels } from "../../../../values/KEP/IDs.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { guildMap } from '../../../index';
import { fetchCommandID } from '../../../Queries/Generic/Commands';
import { AbstractGuildCommand } from '../AbstractGuildCommand';
import { KEP_announceCmd } from "../Interf/KEP_announceCmd";

const contentLiteral = `content`
export class KEP_announceCmdImpl extends AbstractGuildCommand implements KEP_announceCmd {

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `announce`;
    protected _guide = `Ανακοινώνει ένα μήνυμα στα νέα-ενημερώσεις`;
    protected _usage = `announce <message> [<roles>]`;
    private constructor() {
        super()
    }

    static async init(): Promise<KEP_announceCmd> {
        const cmd = new KEP_announceCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    private readonly _aliases = this.addKeywordToAliases
        (
            ['announce', 'ann'], this.keyword
        );

    getCommandData(guild_id: Snowflake): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: contentLiteral,
                    description: `Μήνυμα προς ανακοίνωση`,
                    type: "STRING",
                    required: true
                },
                {
                    name: `role1`,
                    description: `Ρόλος προς ειδοποίηση`,
                    type: "ROLE",
                    required: false
                },
                {
                    name: `role2`,
                    description: `Ρόλος προς ειδοποίηση`,
                    type: "ROLE",
                    required: false
                },
                {
                    name: `role3`,
                    description: `Ρόλος προς ειδοποίηση`,
                    type: "ROLE",
                    required: false
                }
            ]
        };
    }


    async interactiveExecute(interaction: CommandInteraction): Promise<void> {
        const literal = (interaction.options.getString(contentLiteral, true)).substring(0, 2000);
        const roles = ["1", "2", "3"]
            .map((n, i) => interaction.options.getRole(`role${n}`, i === 0))
            .filter(r => typeof r !== "undefined");
        const newsChannel = interaction.guild.channels.cache.get(kepChannels.news as Snowflake) as TextChannel;
        const emb = new MessageEmbed({
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
        const approveBtn = new MessageButton()
            .setCustomId(approveLiteral)
            .setEmoji('✅')
            .setStyle('SUCCESS');
        const rejectBtn = new MessageButton()
            .setCustomId('reject')
            .setEmoji('❌')
            .setStyle('DANGER');

        const modMsg = await modChannel.send({
            content: `ενημέρωση προς έγκριση`,
            embeds: [emb],
            components: [
                new MessageActionRow()
                    .addComponents(approveBtn, rejectBtn)
            ]
        });

        const response = await modMsg.awaitMessageComponent({ filter: btnInt => !btnInt.user.bot });
        if (response.customId === approveLiteral) {
            await newsChannel.send(`${roles.length > 0 ? roles.toString() + '\n' + literal : literal}`);
            await response.update({
                content: `Εγκρίθηκε από ${response.user.tag}`,
                embeds: [emb],
                components: [new MessageActionRow().addComponents(approveBtn.setDisabled(true))]
            });
        }
        else
            await response.update({
                content: `Απορρίφθηκε από **${response.user.tag}**`,
                embeds: [emb],
                components: [new MessageActionRow().addComponents(rejectBtn.setDisabled(true))]
            });

    }

    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        return message.reply(`Χρησιμοποιείτε την εντολή ως slash command \`/${this.keyword}\` ώστε να μπορείτε να δηλώσετε και ρόλους για ping`);
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}