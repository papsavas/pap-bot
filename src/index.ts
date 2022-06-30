import {
    Client, Collection, Constants, GuildChannelManager, Snowflake, TextChannel
} from 'discord.js';
import moment from 'moment-timezone';
import { readdirSync } from 'node:fs';
import { guildID as botGuildID } from '../bot.config.json';
import { guildId as kepGuildId } from "../values/KEP/IDs.json";
import { channels as botGuildChannels } from "../values/PAP/IDs.json";
import { guildId as woapGuildId } from "../values/WOAP/IDs.json";
import { Guilds } from './Entities/Generic/Guilds';
import GenericEvent from './Events/GenericEvent';
import { DMHandlerImpl } from './Handlers/DMs/DMHandlerImpl';
import { DmHandler } from './Handlers/DMs/GenericDm';
import { GlobalCommandHandler } from './Handlers/Global/GlobalCommandHandler';
import { GlobalCommandHandlerImpl } from './Handlers/Global/GlobalCommandHandlerImpl';
import { GenericGuild } from "./Handlers/Guilds/GenericGuild";
import DefaultGuild from "./Handlers/Guilds/Impl/DefaultGuild";
import { KepGuild } from './Handlers/Guilds/Impl/KepGuild';
import { WoapGuild } from './Handlers/Guilds/Impl/WoapGuild';
import { fetchGlobalCommandIds } from './Queries/Generic/Commands';

export let bugsChannel: TextChannel;
export let logsChannel: TextChannel;
let testChannel: TextChannel;

export const inDevelopment: boolean = process.env.NODE_ENV !== 'production';

console.log(`inDevelopment is ${inDevelopment}`);
export const guilds: Guilds = new Collection<Snowflake, GenericGuild>();
export let dmHandler: DmHandler;
export let globalCommandHandler: GlobalCommandHandler;
export let globalCommandsIDs: Snowflake[];

if (inDevelopment)
    require('dotenv').config({ path: require('find-config')('.env') })  //load env variables

console.log(`deployed in "${process.env.NODE_ENV}" mode\n`);

export const PAP = new Client({
    partials: [
        'MESSAGE',
        'CHANNEL',
        'REACTION',
        'USER',
        'GUILD_MEMBER'
    ],
    intents: [
        'GUILDS',
        'GUILD_BANS',
        'GUILD_EMOJIS_AND_STICKERS',
        'GUILD_MEMBERS',
        'GUILD_MESSAGES',
        'GUILD_MESSAGE_REACTIONS',
        'DIRECT_MESSAGES',
        'DIRECT_MESSAGE_REACTIONS',
        'GUILD_VOICE_STATES'
    ],
    allowedMentions: {
        parse: ['users'],
        repliedUser: true
    }
});

async function runScript() {
    //-----insert script-------

    //-------------------------
    console.log('script done');
    return
}

PAP.on('ready', async () => {
    try {
        PAP.user.setActivity('over you', { type: 'WATCHING' });
        const PAPGuildChannels: GuildChannelManager = (await PAP.guilds.cache.get(botGuildID).fetch()).channels;
        const initLogs = PAPGuildChannels.cache.get(botGuildChannels.init_logs) as TextChannel;
        bugsChannel = PAPGuildChannels.cache.get(botGuildChannels.bugs) as TextChannel;
        logsChannel = PAPGuildChannels.cache.get(botGuildChannels.logs) as TextChannel;
        testChannel = PAPGuildChannels.cache.get(botGuildChannels.testing) as TextChannel;
        if (!inDevelopment)
            initLogs.send(`**Launched** __**v2**__ at *${moment().tz("Europe/Athens").locale("el").format("LLLL")}*`)
                .catch(err => console.log("could not send init log"))

        //Initialize global handlers
        dmHandler = await DMHandlerImpl.init();
        await dmHandler.onReady(PAP);
        globalCommandHandler = await GlobalCommandHandlerImpl.init();
        globalCommandsIDs = await fetchGlobalCommandIds();

        // Initializing the guilds
        guilds.set(kepGuildId, await KepGuild.init(kepGuildId));
        guilds.set(woapGuildId, await WoapGuild.init(woapGuildId));
        for (const guildID of [...PAP.guilds.cache.keys()] as Snowflake[]) {
            if (!guilds.has(guildID))
                guilds.set(guildID, await DefaultGuild.init(guildID));
            const g = guilds.get(guildID);
            await g.onReady(PAP); //block until all guilds are loaded
        };
        console.log('smooth init');

    } catch (err) {
        console.log('READY ERROR');
        console.log(err);
    }

    console.log(`___ Initiated ___`);

    if (inDevelopment) {
        await runScript();
    }
});

const eventFiles = readdirSync(__dirname + "/Events/Impl")
    .filter(file => Object.values(Constants.Events)
        .includes(file.split('.')[0])
    );
for (const file of eventFiles) {
    const event: GenericEvent = require(__dirname + `/Events/Impl/${file}`).default;
    PAP.on(event.name, async (...args) => {
        event.execute(...args)
            .catch(err => console.error(err))
    });
}

PAP.login(process.env.BOT_TOKEN)
    .then(r => console.log(`logged in `))
    .catch(err => console.log(`ERROR ON LOGIN: \n${err}`));


process.on('unhandledRejection', (reason, p) => {
    console.log(reason)
});

