import {inject, injectable} from 'inversify';
import {commandType} from '@root/Entities/CommandType';
import {bundle} from '@root/index'
import {TYPES} from '@Inversify/Types';
import {GenericCommand} from '@Commands/GenericCommand';
import {helpCmd} from '@cmdInterfaces/helpCmd';
import {pollCmd} from '@cmdInterfaces/pollCmd';
import {dmMemberCmd} from '@cmdInterfaces/dmMemberCmd'
import {messageChannelCmd} from "@cmdInterfaces/messageChannelCmd";
import "reflect-metadata";
import {CommandHandler} from "@Commands/CommandHandler";
import * as Discord from 'discord.js';

@injectable()
export default class CommandHandlerImpl implements CommandHandler {
    private readonly commands: GenericCommand[]

    constructor(
        @inject(TYPES.HelpCmd) helpCmd: helpCmd,
        @inject(TYPES.PollCmd) pollCmd: pollCmd,
        @inject(TYPES.DmMemberCmd) dmMemberCmd: dmMemberCmd,
        @inject(TYPES.MessageChannelCmd) messageChannelCmd: messageChannelCmd
    ) {
        this.commands = [helpCmd, pollCmd, dmMemberCmd, messageChannelCmd];
    }

    private static returnCommand(receivedMessage: String): commandType {
        const prefix: string = receivedMessage.charAt(0);
        const fullCommand: string = receivedMessage.substr(1); // Remove the prefix ($/?);
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

    public onCommand() {
        const candidateCommand = CommandHandlerImpl.returnCommand(bundle.getMessage().content);
        bundle.setCommand(candidateCommand);
        const commandImpl = this.commands.find((cmds: GenericCommand) => cmds.matchAliases(candidateCommand.primaryCommand))
        if (commandImpl)
            switch (candidateCommand.prefix) {
                case '$':
                    commandImpl.execute(bundle)
                        .catch(err => console.log(`Error on Command ${bundle.getCommand().primaryCommand}\n${err.toString()}`));
                    break;
                case '?':
                    (bundle.getChannel() as Discord.TextChannel).send(commandImpl.getGuide())
                        .catch(err => `Error on Guide sending\n${err.toString()}`);
                    break;
            }
        else
            (bundle.getMessage() as Discord.Message).react('❔').catch();
    }
}