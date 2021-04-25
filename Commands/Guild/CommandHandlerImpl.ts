import {inject, injectable} from 'Inversify';
import * as Discord from 'discord.js';
import {Message, Snowflake} from 'discord.js';
import {qprefix} from '../../botconfig.json'
import {TYPES} from "../../Inversify/Types";
import {bugsChannel, bundle, guildMap} from "../../index";
import {pinMessageCmd} from "./Interf/pinMessageCmd";
import {GenericCommand} from "./GenericCommand";
import {messageChannelCmd} from "./Interf/messageChannelCmd";
import {dmMemberCmd} from "./Interf/dmMemberCmd";
import {CommandHandler} from "./CommandHandler";
import {pollCmd} from "./Interf/pollCmd";
import {unpinMessageCmd} from "./Interf/unpinMessageCmd";
import {helpCmd} from "./Interf/helpCmd";
import {editMessageCmd} from "./Interf/editMessageCmd";
import {commandType} from "../../Entities/Generic/commandType";
import {setPrefixCmd} from "./Interf/setPrefixCmd";
import {addRow} from "../../DB/AbstractRepository";
import {setPermsCmd} from "./Interf/setPermsCmd";
import {showPermsCmd} from "./Interf/showPermsCmd";
import {addResponseCmd} from "./Interf/addResponseCmd";
import {showPersonalResponsesCmd} from "./Interf/showPersonalResponsesCmd";
import {clearMessagesCmd} from "./Interf/clearMessagesCmd";

@injectable()
export default class CommandHandlerImpl implements CommandHandler {

    private readonly commands: GenericCommand[];
    private _guildLogger;

    constructor(
        @inject(TYPES.HelpCmd) helpCmd: helpCmd,
        @inject(TYPES.PollCmd) pollCmd: pollCmd,
        @inject(TYPES.DmMemberCmd) dmMemberCmd: dmMemberCmd,
        @inject(TYPES.MessageChannelCmd) messageChannelCmd: messageChannelCmd,
        @inject(TYPES.PinMessageCmd) pinMessageCmd: pinMessageCmd,
        @inject(TYPES.UnpinMessageCmd) unpinMessageCmd: unpinMessageCmd,
        @inject(TYPES.EditMessageCmd) editMessageCmd: editMessageCmd,
        @inject(TYPES.SetPrefixCmd) setPrefixCmd: setPrefixCmd,
        @inject(TYPES.SetPermsCmd) setPermsCmd: setPermsCmd,
        @inject(TYPES.ShowPermsCmd) showPermsCmd: showPermsCmd,
        @inject(TYPES.AddResponseCmd) addResponseCmd: addResponseCmd,
        @inject(TYPES.ShowPersonalResponsesCmd) showPersonalResponsesCmd: showPersonalResponsesCmd,
        @inject(TYPES.ClearMessagesCmd) clearMessagesCmd: clearMessagesCmd
    ) {
        this.commands = [
            helpCmd, pollCmd, dmMemberCmd, messageChannelCmd,
            pinMessageCmd, unpinMessageCmd, editMessageCmd, setPrefixCmd,
            setPermsCmd, showPermsCmd, addResponseCmd, showPersonalResponsesCmd,
            clearMessagesCmd
        ];
    }

    public getGuildLogger() {
        return this._guildLogger;
    }

    public onCommand(message: Message) {
        /* FLUSH 'commands' DB TABLE AND EXECUTE WHEN COMMANDS ARE COMPLETE
        ALSO CONNECT 'commands with command_perms' with foreign key on commands Completion
        this.commands.forEach(async (cmd) => {

                try{
                    await addRow('commands', {
                        "keyword" : cmd.getKeyword(),
                        "aliases" : cmd.getAliases(),
                        "guide" : cmd.getGuide()
                    });
                }
                catch (err){
                    console.log(err)
                }
        })
    */
        const guildHandler = guildMap.get(message.guild.id);
        const prefix = guildHandler.getSettings().prefix;
        const commandMessage = message;
        const candidateCommand = this.returnCommand(message);
        this.setGuildLogger(message.guild.id);
        bundle.setCommand(candidateCommand);
        const commandImpl = this.commands.find((cmds: GenericCommand) => cmds.matchAliases(candidateCommand?.primaryCommand))
        if (typeof commandImpl !== "undefined") {
            return commandImpl.execute(commandMessage, candidateCommand, this.getGuildLogger())
                .then(execution => commandMessage
                    ?.react('✅')
                    .then(msgReaction=>msgReaction.remove().catch())
                    .catch(err => {
                }))
                .catch(err => this.invalidCommand(err, commandMessage, commandImpl));
            /*
            switch (prefix) {
                case prefix:


                case qprefix:
                    return (bundle.getChannel() as Discord.TextChannel).send(commandImpl.getGuide())
                        .catch(err => `Error on Guide sending\n${err.toString()}`);
            }*/
        } else
            return (bundle.getMessage() as Discord.Message).react('❔').catch();
    }

    private setGuildLogger(guildID: Snowflake) {
        this._guildLogger = guildMap.get(guildID).addGuildLog;
    }

    private returnCommand(receivedMessage: Message): commandType {
        const receivedMessageContent = receivedMessage.content;
        //const prefix: string = receivedMessageContent.charAt(0);
        const fullCommand: string = receivedMessageContent.substr(guildMap.get(receivedMessage.guild.id).getSettings().prefix.length); // Remove the prefix;
        const splitCommand: string[] = fullCommand.split(/(\s+)/).filter(e => e.trim().length > 0) //split command from space(s);
        return {
            //prefix,
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

    private invalidCommand(err: Error, commandMessage: Discord.Message, commandImpl: GenericCommand) {
        const bugsChannelEmbed = new Discord.MessageEmbed({
            author: {
                name: bundle.getGuild().name,
                icon_url: "https://icon-library.com/images/error-icon-transparent/error-icon-transparent-13.jpg"
            },
            thumbnail: {
                proxy_url: bundle.getGuild().iconURL({format: "png", size: 512})
            },
            title: bundle.getCommand().primaryCommand,
            color: "DARK_RED",
            timestamp: new Date()
        });
        bugsChannelEmbed.setDescription(err);
        bugsChannelEmbed.addField(`caused by`, commandMessage.url);
        bugsChannel.send(bugsChannelEmbed).catch(internalErr => console.log("internal error\n", internalErr));
        //send feedback to member
        commandMessage.reply(new Discord.MessageEmbed(
            {
                author: {
                    name: `Error on Command`,
                    icon_url: `https://www.iconfinder.com/data/icons/freecns-cumulus/32/519791-101_Warning-512.png`
                },
                title: guildMap.get(commandMessage.guild.id).getSettings().prefix + commandImpl.getKeyword(),
                description: commandImpl.getGuide(),
                fields: [{name: `Specified error  💥`, value: `• ${err}`}],
                footer: {text: commandImpl.getAliases().toString()},
                color: "RED"
            })
        ).then(msg => msg.delete({timeout: 20000}));
        console.log(`Error on Command ${bundle.getCommand().primaryCommand}\n${err.stack}`)
    }

}