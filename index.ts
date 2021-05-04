import * as Discord from 'discord.js';
import { GuildMember, Message, User } from 'discord.js';
import { guildID as botGuildID } from './botconfig.json'
import { DefaultGuild } from "./Guilds/Impl/DefaultGuild";
import { GenericGuild } from "./Guilds/GenericGuild";
import CommandHandlerImpl from './Commands/Guild/CommandHandlerImpl';


export let bugsChannel: Discord.TextChannel;
export let logsChannel: Discord.TextChannel;

export const inDevelopment: boolean = process.env.NODE_ENV == 'development';

if (inDevelopment)
    require('dotenv').config();  //load env variables


console.log("running in " + process.env.NODE_ENV + " mode\n");

export const PAP = new Discord.Client({
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

export const guildMap = new Map<Discord.Snowflake, GenericGuild>();


PAP.on('guildCreate', (guild) => {
    console.log(`joined ${guild.name} guild`);
    /* implement DB writes */
    /*
    * - guild table add id
    * - command_perms add @everyone role id in every command
    * - add guild settings
    * */
    //onGuildJoin(guild);
})

PAP.on('guildDelete', (guild) => {
    console.log(`left ${guild.name} guild`);
    /* implement DB writes */
    //onGuildLeave(guild);
})

PAP.on('guildUnavailable', (guild) => {
    if (guild.id !== botGuildID)
        logsChannel.send(`@here guild ${guild.name} with id: ${guild.id} is unavailable`)
            .then((msg) => console.log(`${new Date().toString()} : guild ${guild.name} is unavailable.\n`));
});

async function runScript(): Promise<void> {
    //-----insert script--------

    const botCmdManager = PAP.guilds.cache.get(botGuildID).commands;
    await new CommandHandlerImpl().refreshApplicationCommands(botCmdManager);
    const cmds = await PAP.guilds.cache.get(botGuildID).commands.fetch();
    console.table(cmds.map(cmd => [cmd.name, cmd.id, cmd.description]));

    //-------------------------
    return Promise.resolve()
}


PAP.on('ready', async () => {
    if (inDevelopment) {
        await runScript();
        //process.exit(132);
    }
    try {
        // Creating a guild-specific command
        PAP.user.setActivity('over you', { type: 'WATCHING' });
        const PAPGuildChannels: Discord.GuildChannelManager = PAP.guilds.cache.get('746309734851674122').channels;
        const initLogs = PAPGuildChannels.cache.get('746310338215018546') as Discord.TextChannel;
        bugsChannel = PAPGuildChannels.cache.get('746696214103326841') as Discord.TextChannel;
        logsChannel = PAPGuildChannels.cache.get('815602459372027914') as Discord.TextChannel
        if (!inDevelopment)
            await initLogs.send(`**Launched** __**Typescript Version**__ at *${(new Date()).toString()}*`);

        /*PAP.guilds.cache.keyArray()*/
        [botGuildID].forEach((guildID) => {
            if (!guildMap.has(guildID))
                guildMap.set(guildID, new DefaultGuild(guildID));
            guildMap.get(guildID).onReady(PAP);
        });
        console.log('smooth init')

    } catch (err) {
        console.log('ERROR\n' + err.stack);
    }

    console.log(`___Initiated___`);
});


PAP.on('interaction', interaction => {
    // If the interaction isn't a slash command, return
    if (!interaction.isCommand()) return;

    if (!!interaction.guildID)
        guildMap.get(interaction.guildID)
            ?.onSlashCommand(interaction)
            .catch(err => console.log(err));
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
