import {inject, injectable} from 'inversify';
import {commandType} from '../Entities/CommandType';
import {Bundle} from '../index'
import {TYPES} from '../Inversify/Types';
import {GenericCommand} from './GenericCommand';
import {helpCmd} from './Interf/helpCmd';
import {pollCmd} from './Interf/pollCmd';
import "reflect-metadata";
import {CommandHandler} from "./CommandHandler";
import * as Discord from 'discord.js';

@injectable()
export default class CommandHandlerImpl implements CommandHandler {
    private readonly commands: GenericCommand[]

    constructor(
        @inject(TYPES.HelpCmd) helpCmd: helpCmd,
        @inject(TYPES.PollCmd) pollCmd: pollCmd,
    ) {
        this.commands = [helpCmd, pollCmd];
    }

    public onCommand() {
        const candidateCommand = this.returnCommand(Bundle.getMessage().content);
        Bundle.setCommand(candidateCommand);
        const commandImpl = this.commands.find((cmds: GenericCommand) => cmds.matchAliases(candidateCommand.primaryCommand))
        if (commandImpl)
            switch (candidateCommand.prefix) {
                case '$':
                    commandImpl.execute(Bundle);
                    break;
                case '?':
                    (Bundle.getChannel() as Discord.TextChannel).send(commandImpl.getGuide());
                    break;
            }
    }

    private returnCommand(messageContent: String): commandType {
        const prefix: string = messageContent.charAt(0);
        const fullCommand: string = messageContent.substr(1); // Remove the prefix ($/?);
        const splitCommand: string[] = fullCommand.split(/(\s+)/).filter(e => e.trim().length > 0) //split command from space(s);
        return {
            prefix,
            fullCommand,
            splitCommand,
            primaryCommand: splitCommand[0], // The first word directly after the exclamation is the command
            arg1: splitCommand[1],
            arg2: splitCommand[2],
            arg3: splitCommand[3],
            commandless1: splitCommand.slice(1).join(' '),
            commandless2: splitCommand.slice(2).join(' '),
            commandless3: splitCommand.slice(3).join(' ')
        }
    }
}