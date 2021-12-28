import { ApplicationCommandOptionData, ChatInputApplicationCommandData, Collection, CommandInteraction, Message, Snowflake } from 'discord.js';
import { commandLiteral } from '../../../Entities/Generic/command';
import { fetchCommandID } from '../../../Queries/Generic/Commands';
import UpperLowerCaseSwitching from '../../../tools/upperLowerCaseSwitching';
import { AbstractGlobalCommand } from '../AbstractGlobalCommand';
import { mockMessageCmd } from '../Interf/mockMessageCmd';


const textOptionLiteral: ApplicationCommandOptionData['name'] = 'text';
export class MockMessageCmdImpl extends AbstractGlobalCommand implements mockMessageCmd {
    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `mock`;
    readonly guide = `Mocks text`;
    readonly usage = `${this.keyword} <text>`;

    private constructor() { super() }

    static async init(): Promise<mockMessageCmd> {
        const cmd = new MockMessageCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    readonly aliases = this.mergeAliases
        (
            ['mock'],
            this.keyword
        );

    getCommandData(): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: textOptionLiteral,
                    description: 'text to mock',
                    type: 'STRING',
                    required: true
                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        return interaction.reply(UpperLowerCaseSwitching(interaction.options.getString(textOptionLiteral, true)));
    }

    execute(message: Message, { args1 }: commandLiteral): Promise<any> {
        return message.channel.send(UpperLowerCaseSwitching(args1))
            .then(mockedMessage => {
                if (message.deletable) message.delete().catch();
            })
    }




}