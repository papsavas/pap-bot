import { ActionRowBuilder, ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonComponent, ButtonStyle, ChatInputApplicationCommandData, Collection, CommandInteraction, ComponentType, Message, Snowflake } from "discord.js";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { AbstractGlobalCommand } from "../AbstractGlobalCommand";
import { tictactoeCmd } from "../Interf/tictactoeCmd";

const opponentLiteral: ApplicationCommandData['name'] = "opponent";
const emtpyBoard: ActionRowBuilder<ButtonBuilder>[] = ["11", "21", "31"]
    .map(v => new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(v)
                .setLabel('+')
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId(v[0] + `${parseInt(v[1]) + 1}`)
                .setLabel('+')
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId(v[0] + `${parseInt(v[1]) + 2}`)
                .setLabel('+')
                .setStyle(ButtonStyle.Secondary)
        ));


const isWin = (board: ButtonBuilder[][]) => {
    //Check each row
    for (let i = 0; i < 3; i++) {
        if (board[i][0].data.style == board[i][1].data.style && board[i][1].data.style == board[i][2].data.style && board[i][0].data.disabled) {
            return true;
        }
    }

    //Check each column
    for (let j = 0; j < 3; j++) {
        if (board[0][j].data.style == board[1][j].data.style && board[1][j].data.style == board[2][j].data.style && board[0][j].data.disabled) {
            return true
        }
    }

    //Check the diagonals
    if (board[0][0].data.style == board[1][1].data.style && board[1][1].data.style == board[2][2].data.style && board[0][0].data.disabled) {
        return true
    }
    if (board[2][0].data.style == board[1][1].data.style && board[1][1].data.style == board[0][2].data.style && board[2][0].data.disabled) {
        return true
    }
}

export class tictactoeCmdImpl extends AbstractGlobalCommand implements tictactoeCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `tictactoe`;
    readonly guide = `Spawns a tic-tac-toe board`;
    readonly usage = `${this.keyword}`;
    private constructor() { super() }

    static async init(): Promise<tictactoeCmd> {
        const cmd = new tictactoeCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    readonly aliases = this.mergeAliases
        (
            ['tictactoe', 'tic-tac-toe', 'triliza', 'τριλιζα'], this.keyword
        );

    getCommandData(): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: opponentLiteral,
                    description: `play against`,
                    type: ApplicationCommandOptionType.User,
                    required: true
                }
            ]
        }
    }
    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
        const user = interaction.user;
        const opponent = interaction.options.getUser(opponentLiteral, true);
        if (user.id === opponent.id)
            return interaction.reply({ content: "You can't play against yourself", ephemeral: true });

        if (opponent.bot)
            return interaction.reply({ content: `${opponent.username} is a bot`, ephemeral: true });

        const channel = interaction.channel;
        await interaction.reply({
            content: `<@!${opponent.id}> you were challenged to a battle of Tic Tac Toe by <@!${user.id}>`,
            allowedMentions: { repliedUser: false, users: [opponent.id] }
        });
        const msg = await channel.send({ content: 'lets play', components: emtpyBoard });
        const collector = msg.createMessageComponentCollector(
            {
                time: 120000,
                componentType: ComponentType.Button

            }
        )
        let turn = user.id;
        collector.on("collect", async (buttonInteraction) => {
            if (![user.id, opponent.id].includes(buttonInteraction.user.id)) {
                await buttonInteraction.reply({ content: `you were not invited for this game`, ephemeral: true });
                return;
            }
            if (turn !== buttonInteraction.user.id) {
                await buttonInteraction.reply({ content: `It's not your turn, wait for opponent`, ephemeral: true });
                return;
            }
            if (buttonInteraction.isButton()) {
                const id = buttonInteraction.customId;
                const basePlayedButton = new ButtonBuilder({
                    customId: id,
                    disabled: true,
                    style: ButtonStyle.Primary
                })
                const userPlayedButton = ButtonBuilder.from(basePlayedButton)
                    .setStyle(ButtonStyle.Success)
                    .setEmoji("❌");

                const opponentPlayedButton = ButtonBuilder.from(basePlayedButton)
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji({ name: "⭕" });

                const updatedBoard = (await msg.fetch()).components.map(ar => new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        ...ar.components.map(b =>
                            b.customId === id ?
                                buttonInteraction.user.id === user.id ?
                                    userPlayedButton : opponentPlayedButton
                                : ButtonBuilder.from(b as ButtonComponent)
                        ))
                )

                await buttonInteraction.update({
                    components: updatedBoard
                });

                turn = turn === user.id ? opponent.id : user.id;

                const buttons: ButtonBuilder[][] = [];
                updatedBoard.forEach((ar, i) => {
                    buttons.push([]);
                    buttons[i].push(...ar.components);
                });
                if (isWin(buttons)) collector.stop('win');
            }

        })

        collector.on("end", async (collected, reason) => {
            console.log(`tictactoe collector finished with reason ${reason}`);
            switch (reason) {
                case 'win':
                    await msg.edit({
                        content: `**WE HAVE A WINNER!!!**\n**AND A LOSER --> <@!${turn}> <--**`,
                        components: await disabledBoardComponents(msg)
                    })
                    break;
                default:
                    await msg.edit({
                        content: `\`\`\`game ended because of ${reason}\`\`\``,
                        components: await disabledBoardComponents(msg)
                    })
                    break;
            }


        });
    }
    async execute(message: Message, commandLiteral): Promise<void> {
        return
    }


}

const disabledBoardComponents = async (msg: Message) => (await msg.fetch()).components.map(ar => new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
        ar.components.map((b) =>
            ButtonBuilder.from(b as ButtonComponent).setDisabled()
        ))
)