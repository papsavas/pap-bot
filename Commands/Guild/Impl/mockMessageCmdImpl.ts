import * as Discord from 'discord.js';
import { ApplicationCommandData, Message } from 'discord.js';
import { mock as _keyword } from '../../keywords.json';
import { Gmock as _guide } from '../../guides.json';
import { injectable } from "Inversify";
import { AbstractCommand } from "../AbstractCommand";
import { commandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import { mockMessageCmd } from '../Interf/mockMessageCmd';
import UpperLowerCaseSwitching from '../../../toolbox/upperLowerCaseSwitching';


@injectable()
export class MockMessageCmdImpl extends AbstractCommand implements mockMessageCmd {
    private readonly _aliases = this.addKeywordToAliases
        (
            ['mock'],
            _keyword
        );

        getCommandData(): ApplicationCommandData {
            return {
                name: _keyword,
                description: this.getGuide(),
                options: [
                    {
                        name: 'text',
                        description: 'text to mock',
                        type: 'STRING',
                        required: true
                    }
                ]
            }
        }

    async interactiveExecute(interaction: Discord.CommandInteraction):Promise<any>{
        return interaction.reply(UpperLowerCaseSwitching(interaction.options[0].value as string));
    }

    execute(message: Message, { commandless1 }: commandType, addGuildLog: guildLoggerType): Promise<any> {
        return message.channel.send(UpperLowerCaseSwitching(commandless1))
            .then(mockedMessage => {
                if (message.deletable) message.delete().catch();
            })
    }

    getAliases(): string[] {
        return this._aliases;
    }

    getGuide(): string {
        return _guide;
    }

    getKeyword(): string {
        return _keyword;
    }
}