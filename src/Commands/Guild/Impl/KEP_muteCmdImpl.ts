import { ApplicationCommandData, Collection, CommandInteraction, Message, MessageEmbed, Snowflake, TextChannel } from "discord.js";
import moment from "moment-timezone";
import { channels as kepChannels, roles as kepRoles } from "../../../../values/KEP/IDs.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { dropMutedMember, findMutedMember, saveMutedMember } from "../../../Queries/KEP/Member";
import { scheduleTask } from "../../../tools/scheduler";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_muteCmd } from "../Interf/KEP_muteCmd";
moment.locale("el");
moment.tz("Europe/Athens");

export class KEP_muteCmdImpl extends AbstractGuildCommand implements KEP_muteCmd {

    protected _id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `mute`;
    readonly guide = `Mutes a member for certain amount of time`;
    readonly usage = `${this.keyword} <user> <amount> [reason]`;
    private constructor() { super() }
    static async init(): Promise<KEP_muteCmd> {
        const cmd = new KEP_muteCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    readonly aliases = this.mergeAliases
        (
            ["mute", "sks"], this.keyword
        );
    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: "user",
                    description: "User to mute",
                    type: "USER",
                    required: true
                },
                {
                    name: "amount",
                    description: "Amount of time (hours)",
                    type: "INTEGER",
                    required: true,
                    choices: [1, 2, 6, 12, 24].map(x => ({ name: `${x}h`, value: x }))
                },
                {
                    name: "reason",
                    description: "Reason for muting",
                    type: "STRING",
                    required: false
                }
            ]
        }
    }
    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
        const user = interaction.options.getUser("user", true);
        const member = await interaction.guild.members.fetch(user.id);
        if (member.roles.cache.has(kepRoles.muted))
            return interaction.reply({
                content: `${user.username} is already muted!`,
                ephemeral: true
            })
        await interaction.deferReply({ ephemeral: true });
        const amount = interaction.options.getInteger("amount", true);
        const reason = interaction.options.getString("reason", false);
        const provoker_id = interaction.user.id;
        const muteRole = await interaction.guild.roles.fetch(kepRoles.muted);
        const roles = [...member.roles.cache.keys()];
        await member.roles.remove(roles);
        await member.roles.add(muteRole);
        const unmuteAt = moment().add(amount, "hours");
        await saveMutedMember(member.id, unmuteAt, provoker_id, roles, reason);
        //?remove until upstream gets fixed
        //await member.timeout(unmuteAt.milliseconds(), reason);
        const logs = interaction.guild.channels.cache.get(kepChannels.logs) as TextChannel;
        const headerEmb = new MessageEmbed({
            author: {
                name: `CyberSocial Excluded`,
                icon_url: `https://i.imgur.com/92vhTqK.png`
            },
            title: `Mute Logs`,
            color: "DARKER_GREY",
            footer: { text: `Execution Number: 1662` },
        })
        await logs.send({
            embeds: [
                new MessageEmbed(headerEmb)
                    .setDescription(`${interaction.user.toString()}  Muted  ${member.toString()}  for ${amount} hours\nReason: \`${reason ?? "-"}\``)
                    .addField("Muted until", moment(unmuteAt).format("LLL"))
            ]
        })
        scheduleTask(unmuteAt, async () => {
            if (!!await findMutedMember(member.id)) {
                await member.roles.set(roles);
                await dropMutedMember(member.id);
                await logs.send({
                    embeds: [
                        new MessageEmbed(headerEmb)
                            .setDescription(`Unmuted ${member.toString()}`)
                    ]
                })
            }
        })
        return interaction.editReply(`Successfully muted ${member.toString()} for ${amount} hours. Reason: ${reason ?? '-'}`)
    }

    async execute(message: Message, { }: commandLiteral): Promise<unknown> {
        return message.reply("Please use **Slash Command** `/mute`")
    }




}