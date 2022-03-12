import { ActivityType, Client, Collection, Events, GatewayIntentBits, GuildChannelManager, Partials, Snowflake, TextChannel } from 'discord.js';
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
import { DefaultGuild } from "./Handlers/Guilds/Impl/DefaultGuild";
import { KepGuild } from './Handlers/Guilds/Impl/KepGuild';
import { WoapGuild } from './Handlers/Guilds/Impl/WoapGuild';
import { fetchGlobalCommandIds } from './Queries/Generic/Commands';
import { FromValues } from './tools/types';

export { bugsChannel, logsChannel, inDevelopment, guilds, dmHandler, globalCommandHandler, globalCommandsIDs, PAP };

let bugsChannel: TextChannel;
let logsChannel: TextChannel;

const inDevelopment: boolean = process.env.NODE_ENV !== 'production';

console.log(`inDevelopment is ${inDevelopment}`);
const guilds: Guilds = new Collection<Snowflake, GenericGuild>();
let dmHandler: DmHandler;
let globalCommandHandler: GlobalCommandHandler;
let globalCommandsIDs: Snowflake[];

if (inDevelopment)
    require('dotenv').config({ path: require('find-config')('.env') })  //load env variables

console.log(`deployed in "${process.env.NODE_ENV}" mode\n`);

const PAP = new Client({
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember
    ],
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.GuildVoiceStates
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
        PAP.user.setActivity('over you', { type: ActivityType.Watching });
        const PAPGuildChannels: GuildChannelManager = (await PAP.guilds.cache.get(botGuildID).fetch()).channels;
        const initLogs = PAPGuildChannels.cache.get(botGuildChannels.init_logs) as TextChannel;
        bugsChannel = PAPGuildChannels.cache.get(botGuildChannels.bugs) as TextChannel;
        logsChannel = PAPGuildChannels.cache.get(botGuildChannels.logs) as TextChannel;
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
    .filter(file => Object.values(Events)
        .includes(file.split('.')[0] as FromValues<typeof Events>)
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

