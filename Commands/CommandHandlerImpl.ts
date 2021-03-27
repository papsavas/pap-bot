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
import {pinMessageCmd} from "@cmdInterfaces/pinMessageCmd";
import {unpinMessageCmd} from "@cmdInterfaces/unpinMessageCmd";
import {bugsChannel} from '@root/index'

@injectable()
export default class CommandHandlerImpl implements CommandHandler {
    private readonly commands: GenericCommand[]

    constructor(
        @inject(TYPES.HelpCmd) helpCmd: helpCmd,
        @inject(TYPES.PollCmd) pollCmd: pollCmd,
        @inject(TYPES.DmMemberCmd) dmMemberCmd: dmMemberCmd,
        @inject(TYPES.MessageChannelCmd) messageChannelCmd: messageChannelCmd,
        @inject(TYPES.PinMessageCmd) pinMessageCmd: pinMessageCmd,
        @inject(TYPES.UnpinMessageCmd) unpinMessageCmd: unpinMessageCmd,
    ) {
        this.commands = [helpCmd, pollCmd, dmMemberCmd, messageChannelCmd, pinMessageCmd, unpinMessageCmd];
    }

    public onCommand() {
        const candidateCommand = this.returnCommand(bundle.getMessage().content);
        bundle.setCommand(candidateCommand);
        const commandImpl = this.commands.find((cmds: GenericCommand) => cmds.matchAliases(candidateCommand.primaryCommand))
        if (commandImpl)
            switch (candidateCommand.prefix) {
                case '$':
                    commandImpl.execute(bundle)
                        .catch(err => this.invalidCommand(err));
                    break;
                case '?':
                    (bundle.getChannel() as Discord.TextChannel).send(commandImpl.getGuide())
                        .catch(err => `Error on Guide sending\n${err.toString()}`);
                    break;
            }
        else
            (bundle.getMessage() as Discord.Message).react('❔').catch();
    }

    private returnCommand(receivedMessage: String): commandType {
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

    private invalidCommand(err: Error) {
        const emb = new Discord.MessageEmbed({
            author: {
                name: bundle.getGuild().name,
                icon_url: "https://icon-library.com/images/error-icon-transparent/error-icon-transparent-13.jpg"
            },
            thumbnail:{
                proxy_url: bundle.getGuild().iconURL({format:"png", size:512})
            },
            title: bundle.getCommand().primaryCommand,
            color: "DARK_RED",
            timestamp : new Date()
        });
        emb.setDescription(`\`\`\`${err}\`\`\``);
        bugsChannel.send(emb).catch(internalErr => console.log("internal error\n",internalErr));
        console.log(`Error on Command ${bundle.getCommand().primaryCommand}\n${err.toString()}`)
    }
}