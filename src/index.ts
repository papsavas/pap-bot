import {
    Client, Events, GatewayIntentBits, Partials
} from 'discord.js';
import { readdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import GenericEvent from './Events/GenericEvent';

if (process.env.NODE_ENV !== "production") {
    const dotenv = await import("dotenv");
    dotenv.config({ debug: true });
}
console.log(`deployed in "${process.env.NODE_ENV}" mode\n`);

export const PAP = new Client({
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

await PAP.login(process.env.BOT_TOKEN)
    .then(r => console.log(`logged in `))
    .catch(err => console.log(`ERROR ON LOGIN: \n${err}`));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const eventFiles = readdirSync(`${__dirname}/Events/Impl`)
    .filter(file => Object.values(Events)
        .includes(file.split('.')[0] as Events)
    );

eventFiles.forEach(file =>
    (import(`./Events/Impl/${file}`)).then(({ name, execute }: GenericEvent) => {
        console.log(name);
        PAP.on(name, async (...args) => {
            execute(...args)
                .catch(err => console.error(err))
        });
    })
);

process.on('unhandledRejection', (reason, p) => {
    console.log(reason)
});

