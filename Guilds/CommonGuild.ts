import * as Discord from 'discord.js';
import {CommonGuildInterface} from './GuildBase';
import * as DB from '../../PAPbot/toolbox/Gfirestore';

import {
    addresponse,
    adminSwitch,
    bookmarkMessage,
    clearMessages,
    deleteMessage,
    dmMember,
    editMessage,
    execute,
    help,
    logChanges,
    messageChannel,
    mock,
    moveMessage,
    myresponses,
    pinMessage,
    selfnotes,
    setPerms,
    showPerms,
    shutdown,
    simplePoll,
    unpinMessage
} from '../../PAPbot/guildCommands/keywords.json';

import {
    Gaddresponse,
    GadminSwitch,
    GbookmarkMessage,
    GclearMessages,
    GdeleteMessage,
    GdmMember,
    GeditMessage,
    Gexecute,
    Ghelp,
    GlogChanges,
    GmessageChannel,
    Gmock,
    GmoveMessage,
    Gmyresponses,
    GpinMessage,
    Gselfnotes,
    GsetPerms,
    GshowPerms,
    Gshutdown,
    GsimplePoll,
    GunpinMessage
} from '../../PAPbot/guildCommands/guides.json';

export default class CommonGuild implements CommonGuildInterface {

    constructor(readonly client: Discord.Client, readonly name: string, readonly id: Discord.Snowflake) {
        this.client = client;
        this.name = client.guilds.cache.get(id).name;
        this.id = id;

    }

    Discord = Discord;
    PAPregex = /(^|\s)(?:o|ο|ό)?((π(α|ά)π)|(pap))($|\s|[.!?,;])/i;
    prefix = '$';
    gprefix = '?';
    givenName = this.name;
    guild = this.client.guilds.cache.get(this.id);
    everyoneRole = this.guild.roles.fetch(this.id);
    logs: string [] = [''];
    //DB Stuff
    commandPerms = {};
    bugsChannel: Discord.Channel;
    loggingChannel: Discord.Channel;


    commandNamesAndExecutable = {
        [help]: this.help,
        [dmMember]: this.dmMember,
        [showPerms]: this.showPerms,
        [setPerms]: this.setPerms,
        [messageChannel]: this.messageChannel,
        [execute]: this.executeCodeSnippet,
        [shutdown]: this.shutdown,
        [adminSwitch]: this.adminSwitch,
        [editMessage]: this.editMessage,
        [moveMessage]: this.moveMessage,
        [bookmarkMessage]: this.bookmarkMessage,
        [pinMessage]: this.pinMessage,
        [unpinMessage]: this.unpinMessage,
        [simplePoll]: this.simplePoll,
        [mock]: this.mockReceivedMessage,
        [addresponse]: this.addresponse,
        [myresponses]: this.printUserResponses,
        [clearMessages]: this.clearMessages,
        [logChanges]: this.logChanges,
        [deleteMessage]: this.deleteMessagePetition,
        [selfnotes]: this.notes
    };

    commandAlias = {
        [help]: ['help'],
        [dmMember]: ['dm', 'pm', 'δμ', 'πμ'],
        [showPerms]: ['perm', 'perms', 'permission', 'permissions', 'περμς', 'περμ'],
        [setPerms]: ['setperm', 'setperms', 'setpermission', 'setpermissions'],
        [messageChannel]: ['send', 'msgchannel', 'messagechannel', 'message_channel'],
        [execute]: ['exec', 'execute'],
        [shutdown]: ['shutdown', 'restart'],
        [adminSwitch]: ['admin', 'adm', 'αδμ', 'αδμιν'],
        [editMessage]: ['editmessage', 'messageedit', 'messagedit', 'editmsg', 'msgedit'],
        [moveMessage]: ['movemsg', 'msgmove', 'movemessage', 'messagemove', 'mm', 'msgm', 'mmsg'],
        [bookmarkMessage]: ['marker', 'mark', 'μαρκ', 'μαρκερ', 'μάρκερ', 'bookmark', 'bm'],
        [deleteMessage]: ['deletemsg', 'msgdelete', 'deletemessage', 'messagedelet', 'delmsg', 'msgdel'],
        [pinMessage]: ['pin', 'πιν'],
        [unpinMessage]: ['unpin', 'ανπιν'],
        [simplePoll]: ['poll', 'πολλ', 'πολ'],
        [mock]: ['mock'],
        [addresponse]: ['addresp', 'addresponse', 'ar'],
        [myresponses]: ['myresponses', 'myresp'],
        [clearMessages]: ['clear', 'clean', 'svise', 'svhse', 'σβησε', 'σβήσε'],
        [logChanges]: ['logs', 'log', 'logging'],
        [selfnotes]: ['notes', 'mynotes', 'selfnotes']
    }

    guides = {
        [help]: Ghelp,
        [dmMember]: GdmMember,
        [showPerms]: GshowPerms,
        [setPerms]: GsetPerms,
        [messageChannel]: GmessageChannel,
        [execute]: Gexecute,
        [shutdown]: Gshutdown,
        [adminSwitch]: GadminSwitch,
        [editMessage]: GeditMessage,
        [moveMessage]: GmoveMessage,
        [deleteMessage]: GdeleteMessage,
        [bookmarkMessage]: GbookmarkMessage,
        [pinMessage]: GpinMessage,
        [unpinMessage]: GunpinMessage,
        [simplePoll]: GsimplePoll,
        [mock]: Gmock,
        [addresponse]: Gaddresponse,
        [myresponses]: Gmyresponses,
        [clearMessages]: GclearMessages,
        [logChanges]: GlogChanges,
        [selfnotes]: Gselfnotes

    }

    init = async (): Promise<void> => {
        //this.guild =  this.guild;
        await this.everyoneRole;
        //this.name = await this.name;
        this.commandPerms = await DB.read(`commandPerms/${this.id}`);
        this.loggingChannel = await this.client.guilds.cache.get('746309734851674122').channels.cache.get(otherlogsChannelID);
        this.bugsChannel = await this.client.guilds.cache.get('746309734851674122').channels.cache.get(bugsChannelID);

        if (typeof this.commandPerms == 'undefined') {
            //on new guilds
            //init all perms with everyone role
            let writeObj = {};
            for (const [cmd, commandMethods] of Object.entries(this.commandNamesAndExecutable))
                writeObj[cmd] = [this.everyoneRole.id];
            DB.write(`commandPerms/${this.id}`, writeObj);
            this.commandPerms = await DB.read(`commandPerms/${this.id}`);
            console.log(`created commandPerms for ${this.name}`);
        }

        if (Object.keys(this.commandNamesAndExecutable).length != Object.keys(this.commandPerms).length) {
            //in case of new cmds, initialize with everyone role
            let writeobj = {};
            for (const [cmd, commandMethods] of Object.entries(this.commandNamesAndExecutable))
                if (typeof this.commandPerms[cmd] == "undefined")
                    writeobj[cmd] = [this.everyoneRole.id];
            DB.update(`commandPerms/${this.id}`, writeobj);
            this.commandPerms = await DB.read(`commandPerms/${this.id}`);
            console.log(`added command perms: ${writeobj.toString()}`);
        }

        return new Promise((resolve, reject) => {
            resolve(console.log(`${this.name} loaded`));
        });
    }

    async help(): Promise<void> {
        const cmd = this.getCommandByAlias(this.commandAlias, this.arg1);
        if (cmd) {
            await this.channel.send(
                {
                    embed: {
                        author: {
                            name: `Guides`,
                            icon_url: `https://images.vexels.com/media/users/3/152593/isolated/preview/d6368d8155eb832733a200df87f48e92-purple-circle-question-mark-icon-by-vexels.png`
                        },
                        title: `Command: $${cmd}`,
                        description: this.guides[cmd],
                        color: `#702d9e`,
                        footer: {text: this.commandAlias[cmd].toString()}
                    }
                });
            return
        }
    }


}

//https://levelup.gitconnected.com/introduction-to-typescript-interfaces-enforcing-class-implementation-b41f9e290bf9
//προς το τελος