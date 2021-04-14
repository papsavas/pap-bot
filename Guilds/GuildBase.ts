import * as Discord from 'discord.js';

export interface CommonGuildInterface {
    Discord: typeof Discord,
    PAPregex: RegExp,
    prefix: string,
    gprefix: string,
    givenName: string,
    guild: Discord.Guild,
    everyoneRole: Promise<Discord.Role>,
    logs: string[]
    //opinionResponses: Promise<GaxiosPromise> its an array maybe?

    commandNamesAndExecutable : Object,
    commandAlias : Object,
    guides : Object
    init : Function
    commandPerms : Record<string, []>
    loggingChannel : Discord.Channel,
    bugsChannel : Discord.Channel
}

