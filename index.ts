import {of} from 'rxjs';
import {filter, tap} from 'rxjs/operators';
import * as Discord from 'discord.js';
import {onMessage, onMessageDelete} from './EventHandler';
import {guildID} from './botconfig.json'
import Bundle from "./EntitiesBundle/Bundle";
import BundleImpl from "./EntitiesBundle/BundleImpl";

export const bundle :Bundle = new BundleImpl();

export let bugsChannel :Discord.TextChannel;
export let logsChannel :Discord.TextChannel;

const PAP = new Discord.Client({
    partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER'],
    ws: {
        intents: [
            'GUILDS', 'GUILD_BANS', 'GUILD_EMOJIS', 'GUILD_MEMBERS',
            'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS',
            'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS'
        ]
    }
});


let inDevelopment: boolean = false;

if (process.env.NODE_ENV === 'development') {
    require('dotenv').config();  //load env variables
    inDevelopment = true;
}
console.log("running in " + process.env.NODE_ENV + " mode\n");

PAP.on('guildUnavailable', (guild) => {
    if(guild.id !== guildID)
        logsChannel.send(`@here guild ${guild.name} with id: ${guild.id} is unavailable`);
});

PAP.on('ready', () => {
    bundle.setClient(PAP);
    PAP.user.setActivity('over you', {type: 'WATCHING'})
        .then(r => console.log(r))
        .catch(err=> console.log(err));
    const initLogs = PAP.guilds.cache.get('746309734851674122').channels.cache.get('746310338215018546');
    bugsChannel = PAP.guilds.cache.get('746309734851674122').channels.cache.get('746696214103326841') as Discord.TextChannel;
    logsChannel = PAP.guilds.cache.get('746309734851674122').channels.cache.get('815602459372027914') as Discord.TextChannel
    if (initLogs.type === 'text')
        (initLogs as Discord.TextChannel).send(`**Launched** __**Typescript Version**__ at *${(new Date()).toString()}*`);
    console.log(`___Initiated___`);
});


PAP.on('message', (receivedMessage) => {
    of(receivedMessage).pipe(
        filter(receivedMessage =>
            receivedMessage.author == PAP.user
            || !receivedMessage.author.bot),

        tap(receivedMessage => {
            if (receivedMessage.channel.type === "dm") {
                console.log(receivedMessage.content)
            } else if (receivedMessage.channel.type === "text") {
                onMessage(receivedMessage);
            }
        })
    ).subscribe();
})


PAP.on('messageDelete', (deletedMessage) => {
    of(deletedMessage).pipe(
        filter(deletedMessage =>
            deletedMessage.author == PAP.user
            || !deletedMessage.author.bot),

        tap(deletedMessage => {
            if (deletedMessage.channel.type === "dm") {
                console.log(deletedMessage.content)
            } else if (deletedMessage.channel.type === "text") {
                onMessageDelete(deletedMessage);
            }
        })
    ).subscribe();
})

PAP.login(process.env.BOT_TOKEN)
    .then(r => console.log(`logged in`))
    .catch(err => console.log(`ERROR ON LOGIN:\n${err}`));