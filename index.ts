import * as Discord from 'discord.js';
import {GuildMember, Message, User} from 'discord.js';
import {guildID as botGuildID} from './botconfig.json'
import Bundle from "./BundlePackage/Bundle";
import BundleImpl from "./BundlePackage/BundleImpl";
import {DefaultGuild} from "./Guilds/Impl/DefaultGuild";
import {GenericGuild} from "./Guilds/GenericGuild";
import {addStudent, addStudents, dropStudent, fetchStudent, studentType} from "./Entities/KEP/Student";
import {addRows, createTable, returnTable} from "./DB/dbRepo";
import {readData} from "./DB/firestoreRepo";

export const bundle: Bundle = new BundleImpl();

export let bugsChannel: Discord.TextChannel;
export let logsChannel: Discord.TextChannel;

export const inDevelopment: boolean = process.env.NODE_ENV == 'development';

if (inDevelopment)
    require('dotenv').config();  //load env variables


console.log("running in " + process.env.NODE_ENV + " mode\n");

export const PAP = new Discord.Client({
    partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER'],
    ws: {
        intents: [
            'GUILDS', 'GUILD_BANS', 'GUILD_EMOJIS', 'GUILD_MEMBERS',
            'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS',
            'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS'
        ]
    }
});

export const guildMap = new Map<Discord.Snowflake, GenericGuild>();


PAP.on('guildUnavailable', (guild) => {
    if (guild.id !== botGuildID)
        logsChannel.send(`@here guild ${guild.name} with id: ${guild.id} is unavailable`)
            .then((msg) => console.log(`${new Date().toString()} : guild ${guild.name} is unavailable.\n`));
});

async function runScript() :Promise<void>{
    /*
    const f_roles = await readData('KEP/roles');
    const res = await createTable('roles', (tableBuilder => {

        tableBuilder.string('name').notNullable();
        tableBuilder.string('id', 18).unique().notNullable();
    }));

    const rows = []
    for(const [name, id] of Object.entries(f_roles)){
        rows.push({"name" : name, "id": id});
    }
    await addRows('roles', rows);
    */
    return Promise.resolve()
}

PAP.on('ready', async () => {
    if (inDevelopment) {
        await runScript();
        process.exit();
    }
    try {
        bundle.setClient(PAP);
        await PAP.user.setActivity('over you', {type: 'WATCHING'})
            //.catch(err => console.log(err));
        const PAPGuildChannels: Discord.GuildChannelManager = PAP.guilds.cache.get('746309734851674122').channels;
        const initLogs = PAPGuildChannels.cache.get('746310338215018546') as Discord.TextChannel;
        bugsChannel = PAPGuildChannels.cache.get('746696214103326841') as Discord.TextChannel;
        logsChannel = PAPGuildChannels.cache.get('815602459372027914') as Discord.TextChannel
        await initLogs.send(`**Launched** __**Typescript Version**__ at *${(new Date()).toString()}*`);

        /*PAP.guilds.cache.keyArray()*/[botGuildID].forEach((guildID) => {
            if(!guildMap.has(guildID))
                guildMap.set(guildID, new DefaultGuild(guildID));
        });
        //const table = await returnTable('person', ['name']);
        //console.log(guildMap);
        console.log('smooth init')

    }
    catch (err) {
        console.log('ERROR\n'+err);
    }

    console.log(`___Initiated___`);
});


PAP.on('message', (receivedMessage) => {
    if (receivedMessage.author.bot)
        return
    switch (receivedMessage.channel.type) {
        case 'dm':
            break;

        case 'text':
            guildMap.get(receivedMessage.guild.id)
                ?.onMessage(receivedMessage)
                .catch(err => console.log(err));
            break;
    }
})


PAP.on('messageDelete', async (deletedMessage) => {
    if (deletedMessage.partial) return; //cannot fetch deleted data

    if (deletedMessage.author == PAP.user || deletedMessage.author.bot)
        return

    switch (deletedMessage.channel.type) {
        case 'dm':
            break;

        case 'text':
            guildMap.get(deletedMessage.guild.id)
                ?.onMessageDelete(deletedMessage as Message)
                .catch(err => console.log(err));
            break;
    }

})

PAP.on('messageReactionAdd', async (messageReaction, user) => {
    try {
        if (messageReaction.partial) await messageReaction.fetch();
        if (user.partial) await user.fetch();
    } catch (err) {
        console.error(err)
    }
    guildMap.get(messageReaction.message.guild.id)
        ?.onMessageReactionAdd(messageReaction, user as User)
        .catch(err => console.log(err));

});

PAP.on('messageReactionRemove', async (messageReaction, user) => {
    try {
        if (messageReaction.partial) await messageReaction.fetch();
        if (user.partial) await user.fetch();
    } catch (err) {
        console.error(err)
    }
    guildMap.get(messageReaction.message.guild.id)
        ?.onMessageReactionRemove(messageReaction, user as User)
        .catch(err => console.log(err));
});

PAP.on('guildMemberAdd', (member) => {
    guildMap.get(member.guild.id)
        ?.onGuildMemberAdd(member)
        .catch(err => console.log(err));
});

PAP.on('guildMemberRemove', async (member) => {
    if (member.partial) await member.fetch().catch(console.error);
    guildMap.get(member.guild.id).onGuildMemberRemove(member as GuildMember)
        .catch(err => console.log(err));

});

PAP.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (oldMember.partial) await oldMember.fetch().catch(console.error);
    guildMap.get(newMember.guild.id)
        ?.onGuildMemberUpdate(oldMember as GuildMember, newMember)
        .catch(err => console.log(err));

});

PAP.on('error', (error) => {
    console.error(error);
});


PAP.login(process.env.BOT_TOKEN)
    .then(r => console.log(`logged in`))
    .catch(err => console.log(`ERROR ON LOGIN:\n${err}`));