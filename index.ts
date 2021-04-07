import {of} from 'rxjs';
import {filter, tap} from 'rxjs/operators';
import * as Discord from 'discord.js';
import {onMessage, onMessageDelete} from './EventHandler';
import {guildID} from './botconfig.json'
import Bundle from "./EntitiesBundle/Bundle";
import BundleImpl from "./EntitiesBundle/BundleImpl";
import {logToDB} from "./DB/server";

export const bundle: Bundle = new BundleImpl();

export let bugsChannel: Discord.TextChannel;
export let logsChannel: Discord.TextChannel;

export const inDevelopment: boolean = process.env.NODE_ENV == 'development';

if (inDevelopment)
    require('dotenv').config();  //load env variables


console.log("running in " + process.env.NODE_ENV + " mode\n");

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


PAP.on('guildUnavailable', (guild) => {
    if (guild.id !== guildID)
        logsChannel.send(`@here guild ${guild.name} with id: ${guild.id} is unavailable`);
});

PAP.on('ready', async () => {
    try {
        bundle.setClient(PAP);
        PAP.user.setActivity('over you', {type: 'WATCHING'})
            .catch(err => console.log(err));
        const PAPGuildChannels: Discord.GuildChannelManager = PAP.guilds.cache.get('746309734851674122').channels;
        const initLogs = PAPGuildChannels.cache.get('746310338215018546') as Discord.TextChannel;
        bugsChannel = PAPGuildChannels.cache.get('746696214103326841') as Discord.TextChannel;
        logsChannel = PAPGuildChannels.cache.get('815602459372027914') as Discord.TextChannel
        await initLogs.send(`**Launched** __**Typescript Version**__ at *${(new Date()).toString()}*`);
        await logToDB();
        console.log('smooth init')
    } catch (err) {
        console.log('ERROR\n', err);
    }

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
            !!deletedMessage &&
            deletedMessage.author?.id != PAP.user.id
            || !deletedMessage?.author.bot),

        tap(deletedMessage => {
            if (deletedMessage.channel.type === "dm") {
                //console.log(deletedMessage.content)
            } else if (deletedMessage.channel.type === "text") {
                onMessageDelete(deletedMessage);
            }
        })
    ).subscribe();
})

PAP.login(process.env.BOT_TOKEN)
    .then(r => console.log(`logged in`))
    .catch(err => console.log(`ERROR ON LOGIN:\n${err}`));