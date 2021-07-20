import {
    Client, Collection, CommandInteraction, GuildChannelManager, GuildMember, Message, MessageEmbed, MessageReaction, Snowflake, TextChannel, User
} from 'discord.js';
import * as _ from 'lodash';
import { creatorID, guildID as botGuildID } from '../botconfig.json';
import { DMHandlerImpl } from './Handlers/DMs/DMHandlerImpl';
import { DmHandler } from './Handlers/DMs/GenericDm';
import { GlobalCommandHandler } from './Handlers/Global/GlobalCommandHandler';
import { GlobalCommandHandlerImpl } from './Handlers/Global/GlobalCommandHandlerImpl';
import { GenericGuild } from "./Handlers/Guilds/GenericGuild";
import { DefaultGuild } from "./Handlers/Guilds/Impl/DefaultGuild";
import { fetchGlobalCommandIds } from './Queries/Generic/Commands';

export let bugsChannel: TextChannel;
export let logsChannel: TextChannel;
export const inDevelopment: boolean = process.env.NODE_ENV === 'development';

console.log(`inDevelopment is ${inDevelopment}`);
export const guildMap = new Collection<Snowflake, GenericGuild>();
let dmHandler: DmHandler;
let globalCommandHandler: GlobalCommandHandler;
export let globalCommandsIDs: Snowflake[];


if (inDevelopment)
    require('dotenv').config({ path: '../.env' });  //load env variables


console.log(`running in "${process.env.NODE_ENV}" mode\n`);

export const PAP = new Client({
    partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER'],
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



async function runScript(): Promise<void> {
    //-----insert script--------

    //-------------------------
    console.log('script done');
    return
}

PAP.on('ready', async () => {
    try {
        // Creating a guild-specific command
        PAP.user.setActivity('over you', { type: 'WATCHING' });
        const PAPGuildChannels: GuildChannelManager = PAP.guilds.cache.get(botGuildID as Snowflake).channels;
        const initLogs = PAPGuildChannels.cache.get('746310338215018546') as TextChannel;
        bugsChannel = PAPGuildChannels.cache.get('746696214103326841') as TextChannel;
        logsChannel = PAPGuildChannels.cache.get('815602459372027914') as TextChannel
        if (!inDevelopment)
            await initLogs.send(`**Launched** __**Typescript Version**__ at *${(new Date()).toString()}*`);

        /*
        TODO: Replace on release 
        PAP.guilds.cache.keyArray()
        */
        for (const guildID of [botGuildID] as Snowflake[]) {
            if (!guildMap.has(guildID))
                guildMap.set(guildID, await DefaultGuild.init(guildID));
            await guildMap.get(guildID).onReady(PAP); //block until all guilds are loaded
        };

        dmHandler = await DMHandlerImpl.init();
        await dmHandler.onReady(PAP);
        globalCommandHandler = await GlobalCommandHandlerImpl.init();
        globalCommandsIDs = await fetchGlobalCommandIds();
        console.log('smooth init');

    } catch (err) {
        console.log('ERROR\n' + err.stack);
    }
    console.log(`___Initiated___`);

    if (inDevelopment) {
        await runScript();
    }
});


PAP.on('guildCreate', (guild) => {
    console.log(`joined ${guild.name} guild`);
    //TODO: implement DB writes
    /*
    * - guild table add id
    * - command_perms add @everyone role id in every command 👇
    await addRows(
        'command_perms',
        guildMap.get(botGuildID as Snowflake).commandHandler.commands.map(async cmd =>
            ( {
                "guild_id": guild.id,
                "role_id": guild.id,
                "command_id": cmd.id
            }))
    );
    * - add guild settings
    * */
    //onGuildJoin(guild);
})

PAP.on('guildDelete', guild => {
    console.log(`left ${guild.name} guild`);
    //TODO: implement DB writes
    //onGuildLeave(guild);
})

PAP.on('guildUnavailable', (guild) => {
    if (guild.id !== botGuildID)
        logsChannel.send(`@here guild ${guild.name} with id: ${guild.id} is unavailable`)
            .then((msg) => console.log(`${new Date().toString()} : guild ${guild.name} is unavailable.\n`));
});

//when cache is fully loaded



PAP.on('applicationCommandCreate', (command) => console.log(`created ${command.name}-${command.id} command`));
PAP.on('applicationCommandDelete', (command) => console.log(`deleted ${command.name} command`));
PAP.on('applicationCommandUpdate', (oldCommand, newCommand) => {
    const diff = {
        name: oldCommand.name === newCommand.name,
        description: oldCommand.description === newCommand.description,
        perms: _.isEqual(oldCommand.permissions, newCommand.permissions),
        defaultPermission: oldCommand.defaultPermission === newCommand.defaultPermission,
        options: _.isEqual(oldCommand.options, newCommand.options),
    }
    console.log(`command ${newCommand.name} updated for ${newCommand.guild?.name}`);
    for (const [k, v] of Object.entries(diff)) {
        if (!v)
            console.log(`${k} changed`);
    }
})


PAP.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        //TODO: check if global
        if (globalCommandsIDs.includes(interaction.commandId)) {
            console.log('global command received');
            globalCommandHandler.onSlashCommand(interaction)
                .catch(console.error);
        }

        else if (interaction.guildId) {
            try {
                guildMap.get(interaction.guildId)
                    ?.onSlashCommand(interaction)
            } catch (error) {
                console.log(error)
            }
        }
        else if (interaction.channel.type === "DM") {
            dmHandler.onSlashCommand(interaction)
                .catch(console.error);
            console.log(`dm interaction received\n${(interaction as CommandInteraction).commandName}
    from ${interaction.user.tag}`)
        }
        else {
            console.log(`unspecified interaction channel\n${interaction.toJSON()}`)
        }
    }

    else if (interaction.isButton()) {
        if (interaction.guildId) {
            try {
                guildMap.get(interaction.guildId)
                    ?.onButton(interaction);

            } catch (error) {
                console.log(error)
            }
        }
        else {
            dmHandler.onButton(interaction)
                .catch(console.error);
            console.log('dm button received');
        }
    }

    else if (interaction.isSelectMenu()) {
        if (interaction.guildId) {
            try {
                guildMap.get(interaction.guildId)
                    ?.onSelectMenu(interaction);

            } catch (error) {
                console.log(error)
            }
        }
        else if (interaction.channel.type === "DM") {
            dmHandler.onSelectMenu(interaction)
                .catch(console.error);
            console.log('dm select received');
        }
    }

    else {
        console.log(`unhandled interaction type in ${interaction.channel.id} channel.TYPE = ${interaction.type}`);
        await bugsChannel.send({
            embeds: [
                new MessageEmbed({
                    title: `Untracked Interaction`,
                    description: `received untracked interaction in ${interaction.guild.name}`,
                    fields: [
                        { name: `Type`, value: interaction.type },
                        { name: `Channel`, value: interaction.channel.toString() },
                        { name: `Interaction ID`, value: interaction.id }
                    ]
                })
            ]
        })
    }
});


PAP.on('messageCreate', (receivedMessage) => {
    if (receivedMessage.author.id === creatorID && receivedMessage.content.startsWith('eval'))
        try {
            const Discord = require('discord.js');
            return eval(receivedMessage.cleanContent
                .substring('eval'.length + 1)
                .replace(/(\r\n|\n|\r)/gm, "")); //remove all line breaks
        }
        catch (err) {
            console.error(err);
            receivedMessage.reply({ content: err.toString(), allowedMentions: { parse: [] } })
                .catch(internalErr => console.log(internalErr));
        }

    if (receivedMessage.author.bot)
        return

    switch (receivedMessage.channel.type) {
        case 'DM':
            break;

        case 'GUILD_TEXT': case 'GUILD_PRIVATE_THREAD': case 'GUILD_PUBLIC_THREAD':
            guildMap.get(receivedMessage.guild.id)
                ?.onMessage(receivedMessage)
                .catch(err => console.log(err));
            break;

        default:
            bugsChannel.send(`received message from untracked channel type
CHANNEL_TYPE: ${receivedMessage.channel.type}
ID: ${receivedMessage.id}
from: ${receivedMessage.member.displayName}
content: ${receivedMessage.content}\n`).catch(console.error);
    }
})


PAP.on('messageDelete', async (deletedMessage) => {
    if (deletedMessage.partial) return; //cannot fetch deleted data

    if (deletedMessage.author == PAP.user || deletedMessage.author.bot)
        return

    switch (deletedMessage.channel.type) {
        case 'DM':
            break;

        case 'GUILD_TEXT': case 'GUILD_PRIVATE_THREAD': case 'GUILD_PUBLIC_THREAD':
            guildMap.get(deletedMessage.guild?.id)
                ?.onMessageDelete(deletedMessage as Message)
                .catch(err => console.log(err));
            break;
    }
})

PAP.on('messageReactionAdd', async (reaction, user) => {
    try {
        guildMap.get(reaction.message.guild?.id)
            ?.onMessageReactionAdd(
                reaction.partial ? await reaction.fetch() : reaction as MessageReaction,
                user.partial ? await user.fetch() : user as User,
            )
    } catch (err) {
        console.error(err)
    }
});

PAP.on('messageReactionRemove', async (reaction, user) => {
    try {
        guildMap.get(reaction.message.guild?.id)
            ?.onMessageReactionRemove(
                reaction.partial ? await reaction.fetch() : reaction as MessageReaction,
                user.partial ? await user.fetch() : user as User,
            )
    } catch (err) {
        console.error(err)
    }
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
    guildMap.get(newMember.guild.id)
        ?.onGuildMemberUpdate(
            oldMember.partial ? await oldMember.fetch() : oldMember as GuildMember,
            newMember)
        .catch(err => console.log(err));
});

PAP.on('error', (error) => {
    console.error(error);
});



PAP.login(process.env.BOT_TOKEN)
    .then(r => console.log(`logged in `))
    .catch(err => console.log(`ERROR ON LOGIN: \n${err}`));
