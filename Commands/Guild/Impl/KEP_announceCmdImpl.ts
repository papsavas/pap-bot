
import { AbstractGuildCommand } from '../AbstractGuildCommand';
import { Snowflake, ApplicationCommandData, CommandInteraction, Message, MessageEmbed, Role, TextChannel, MessageActionRow, MessageButton } from "discord.js";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { KEP_announceCmd } from "../Interf/KEP_announceCmd";
import { guildMap } from '../../..';
import { fetchCommandID } from '../../../Queries/Generic/Commands';

throw new Error('dummy ids, remove if attached');

//TODO: Add valid Channel ids

const contentLiteral = `content`

export class KEP_announceCmdImpl extends AbstractGuildCommand implements KEP_announceCmd {

    protected _id: Snowflake;
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

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
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
        const literal = (interaction.options.get(contentLiteral).value as string).substring(0, 2000);
        const roles = interaction.options.filter(opt => opt.type === "ROLE")
            .mapValues(v => v.role).array();
        const newsChannel = interaction.guild.channels.cache.get('newsChannelID' as Snowflake) as TextChannel;
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

        const modChannel = interaction.guild.channels.cache.get('mod guild id' as Snowflake) as TextChannel;
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
                content: `Απορρίφθηκε από ${response.user.tag}`,
                embeds: [emb],
                components: [new MessageActionRow().addComponents(rejectBtn.setDisabled(true))]
            });

    }

    async execute(message: Message, { }: literalCommandType): Promise<unknown> {
        return message.reply(`Χρησιμοποιείτε την εντολή ως slash command \`/${this.keyword}\` ώστε να μπορείτε να δηλώσετε και ρόλους για ping`);
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}