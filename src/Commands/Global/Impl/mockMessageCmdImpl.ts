import { ApplicationCommandData, ApplicationCommandOptionData, CommandInteraction, Message, Snowflake } from 'discord.js';
import { commandLiteral } from "../../../Entities/Generic/command";
import { guildMap } from '../../../index';
import { fetchCommandID } from '../../../Queries/Generic/Commands';
import UpperLowerCaseSwitching from '../../../toolbox/upperLowerCaseSwitching';
import { AbstractDMCommand } from '../../DM/AbstractDMCommand';
import { mockMessageCmd } from '../Interf/mockMessageCmd';


const textOptionLiteral: ApplicationCommandOptionData['name'] = 'text';
export class MockMessageCmdImpl extends AbstractDMCommand implements mockMessageCmd {
    protected _id: Snowflake;
    protected _keyword = `mock`;
    protected _guide = `Mocks text`;
    protected _usage = `mock <text>`;

    private constructor() { super() }

    static async init(): Promise<mockMessageCmd> {
        const cmd = new MockMessageCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['mock'],
            this.keyword
        );

    getCommandData(): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
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

    execute(message: Message, { commandless1 }: commandLiteral): Promise<any> {
        return message.channel.send(UpperLowerCaseSwitching(commandless1))
            .then(mockedMessage => {
                if (message.deletable) message.delete().catch();
            })
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}