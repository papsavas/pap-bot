"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guildMap = exports.PAP = exports.inDevelopment = exports.logsChannel = exports.bugsChannel = void 0;
const Discord = require("discord.js");
const botconfig_json_1 = require("./botconfig.json");
const DefaultGuild_1 = require("./Guilds/Impl/DefaultGuild");
exports.inDevelopment = process.env.NODE_ENV == 'development';
if (exports.inDevelopment)
    require('dotenv').config(); //load env variables
console.log("running in " + process.env.NODE_ENV + " mode\n");
exports.PAP = new Discord.Client({
    partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER'],
    intents: [
        'GUILDS', 'GUILD_BANS', 'GUILD_EMOJIS', 'GUILD_MEMBERS',
        'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS',
        'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS'
    ],
    allowedMentions: {
        parse: ['users'],
        repliedUser: true
    }
});
exports.guildMap = new Map();
// The data for our command
const commandData = {
    name: 'echo',
    description: 'Replies with your input!',
    options: [{
            name: 'input',
            type: 'STRING',
            description: 'The input which should be echoed back',
            required: true,
        }],
};
exports.PAP.on('guildCreate', (guild) => {
    console.log(`joined ${guild.name} guild`);
    /* implement DB writes */
    /*
    * - guild table add id
    * - command_perms add @everyone role id in every command
    * - add guild settings
    * */
    //onGuildJoin(guild);
});
exports.PAP.on('guildDelete', (guild) => {
    console.log(`left ${guild.name} guild`);
    /* implement DB writes */
    //onGuildLeave(guild);
});
exports.PAP.on('guildUnavailable', (guild) => {
    if (guild.id !== botconfig_json_1.guildID)
        exports.logsChannel.send(`@here guild ${guild.name} with id: ${guild.id} is unavailable`)
            .then((msg) => console.log(`${new Date().toString()} : guild ${guild.name} is unavailable.\n`));
});
async function runScript() {
    //-----insert script--------
    //await commandHandler.registerApplicationCommands(PAP.guilds.cache.get('746309734851674122').commands);
    //-------------------------
    return Promise.resolve();
}
exports.PAP.on('ready', async () => {
    if (exports.inDevelopment) {
        await runScript();
        //process.exit(132);
    }
    try {
        // Creating a guild-specific command
        exports.PAP.user.setActivity('over you', { type: 'WATCHING' });
        const PAPGuildChannels = exports.PAP.guilds.cache.get('746309734851674122').channels;
        const initLogs = PAPGuildChannels.cache.get('746310338215018546');
        exports.bugsChannel = PAPGuildChannels.cache.get('746696214103326841');
        exports.logsChannel = PAPGuildChannels.cache.get('815602459372027914');
        if (!exports.inDevelopment)
            await initLogs.send(`**Launched** __**Typescript Version**__ at *${(new Date()).toString()}*`);
        /*PAP.guilds.cache.keyArray()*/
        [botconfig_json_1.guildID].forEach((guildID) => {
            if (!exports.guildMap.has(guildID))
                exports.guildMap.set(guildID, new DefaultGuild_1.DefaultGuild(guildID));
            exports.guildMap.get(guildID).onReady(exports.PAP);
        });
        console.log('smooth init');
    }
    catch (err) {
        console.log('ERROR\n' + err.stack);
    }
    console.log(`___Initiated___`);
});
exports.PAP.on('interaction', interaction => {
    // If the interaction isn't a slash command, return
    if (!interaction.isCommand())
        return;
    if (!!interaction.guildID)
        exports.guildMap.get(interaction.guildID)
            ?.onSlashCommand(interaction)
            .catch(err => console.log(err));
});
exports.PAP.on('message', (receivedMessage) => {
    if (receivedMessage.author.bot)
        return;
    switch (receivedMessage.channel.type) {
        case 'dm':
            break;
        case 'text':
            exports.guildMap.get(receivedMessage.guild.id)
                ?.onMessage(receivedMessage)
                .catch(err => console.log(err));
            break;
    }
});
exports.PAP.on('messageDelete', async (deletedMessage) => {
    if (deletedMessage.partial)
        return; //cannot fetch deleted data
    if (deletedMessage.author == exports.PAP.user || deletedMessage.author.bot)
        return;
    switch (deletedMessage.channel.type) {
        case 'dm':
            break;
        case 'text':
            exports.guildMap.get(deletedMessage.guild.id)
                ?.onMessageDelete(deletedMessage)
                .catch(err => console.log(err));
            break;
    }
});
exports.PAP.on('messageReactionAdd', async (messageReaction, user) => {
    try {
        if (messageReaction.partial)
            await messageReaction.fetch();
        if (user.partial)
            await user.fetch();
    }
    catch (err) {
        console.error(err);
    }
    exports.guildMap.get(messageReaction.message.guild.id)
        ?.onMessageReactionAdd(messageReaction, user)
        .catch(err => console.log(err));
});
exports.PAP.on('messageReactionRemove', async (messageReaction, user) => {
    try {
        if (messageReaction.partial)
            await messageReaction.fetch();
        if (user.partial)
            await user.fetch();
    }
    catch (err) {
        console.error(err);
    }
    exports.guildMap.get(messageReaction.message.guild.id)
        ?.onMessageReactionRemove(messageReaction, user)
        .catch(err => console.log(err));
});
exports.PAP.on('guildMemberAdd', (member) => {
    exports.guildMap.get(member.guild.id)
        ?.onGuildMemberAdd(member)
        .catch(err => console.log(err));
});
exports.PAP.on('guildMemberRemove', async (member) => {
    if (member.partial)
        await member.fetch().catch(console.error);
    exports.guildMap.get(member.guild.id).onGuildMemberRemove(member)
        .catch(err => console.log(err));
});
exports.PAP.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (oldMember.partial)
        await oldMember.fetch().catch(console.error);
    exports.guildMap.get(newMember.guild.id)
        ?.onGuildMemberUpdate(oldMember, newMember)
        .catch(err => console.log(err));
});
exports.PAP.on('error', (error) => {
    console.error(error);
});
/*
PAP.login(process.env.BOT_TOKEN)
    .then(r => console.log(`logged in`))
    .catch(err => console.log(`ERROR ON LOGIN:\n${err}`));
*/ 
