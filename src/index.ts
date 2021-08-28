import {
    Client, Collection, CommandInteraction, GuildChannelManager, GuildMember, Message, MessageEmbed, MessageReaction, Snowflake, TextChannel, User
} from 'discord.js';
import _ from 'lodash';
import moment from 'moment-timezone';
import { creatorID, guildID as botGuildID } from '../botconfig.json';
import { guildId as kepGuildId } from "../values/KEP/IDs.json";
import { channels as botGuildChannels } from "../values/PAP/IDs.json";
import { guildId as woapGuildId } from "../values/WOAP/IDs.json";
import { GuildMap } from './Entities/Generic/guildMap';
import { DMHandlerImpl } from './Handlers/DMs/DMHandlerImpl';
import { DmHandler } from './Handlers/DMs/GenericDm';
import { GlobalCommandHandler } from './Handlers/Global/GlobalCommandHandler';
import { GlobalCommandHandlerImpl } from './Handlers/Global/GlobalCommandHandlerImpl';
import { GenericGuild } from "./Handlers/Guilds/GenericGuild";
import { DefaultGuild } from "./Handlers/Guilds/Impl/DefaultGuild";
import { KepGuild } from './Handlers/Guilds/Impl/KepGuild';
import { WoapGuild } from './Handlers/Guilds/Impl/WoapGuild';
import { fetchGlobalCommandIds } from './Queries/Generic/Commands';
import { saveGuild } from './Queries/Generic/Guild';

export let bugsChannel: TextChannel;
export let logsChannel: TextChannel;
let testChannel: TextChannel;

export const inDevelopment: boolean = process.env.NODE_ENV === 'development';

console.log(`inDevelopment is ${inDevelopment}`);
export const guildMap: GuildMap = new Collection<Snowflake, GenericGuild>();
let dmHandler: DmHandler;
let globalCommandHandler: GlobalCommandHandler;
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
        'GUILD_MEMBER',
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
        testChannel = PAPGuildChannels.cache.get(botGuildChannels.testing) as TextChannel
        if (!inDevelopment)
            initLogs.send(`**Launched** __**v2**__ at *${moment().tz("Europe/Athens").locale("el").format("LLLL")}*`)
                .catch(err => console.log("could not send init log"))

        //Initialize global handlers
        dmHandler = await DMHandlerImpl.init();
        await dmHandler.onReady(PAP);
        globalCommandHandler = await GlobalCommandHandlerImpl.init();
        globalCommandsIDs = await fetchGlobalCommandIds();

        // Initializing the guilds
        guildMap.set(kepGuildId, await KepGuild.init(kepGuildId));
        guildMap.set(woapGuildId, await WoapGuild.init(woapGuildId));
        for (const guildID of [...PAP.guilds.cache.keys()] as Snowflake[]) {
            if (!guildMap.has(guildID))
                guildMap.set(guildID, await DefaultGuild.init(guildID));
            const g = guildMap.get(guildID);
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

PAP.on('guildCreate', async (guild) => {
    console.log(`joined ${guild.name} guild`);
    try {
        await saveGuild(guild) //required before init
        guildMap.set(guild.id, await DefaultGuild.init(guild.id));
        const g = guildMap.get(guild.id);
        await g.onGuildJoin(guild);
        await g.onReady(PAP);
        console.log(`${guild.name} ready`)
    } catch (err) {
        console.log(err)
    }
})

PAP.on('guildDelete', async guild => {
    console.log(`left ${guild.name} guild`);
    const g = guildMap.get(guild.id);
    g.onGuildLeave(guild)
        .then(() => guildMap.delete(guild.id))
        .catch(console.error);
})

PAP.on('guildUnavailable', (guild) => {
    if (guild.id !== botGuildID)
        logsChannel.send(`@here guild ${guild.name} with id: ${guild.id} is unavailable`)
            .then(() => console.log(`${new Date().toString()} : guild ${guild.name} is unavailable.\n`));
});

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
        if (globalCommandsIDs.includes(interaction.commandId)) {
            globalCommandHandler.onSlashCommand(interaction)
                .catch(console.error);
        }
        else if (interaction.guildId) {
            guildMap.get(interaction.guildId)
                ?.onSlashCommand(interaction)
                .catch(console.error);
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

    else if (interaction.isContextMenu()) {
        if (globalCommandsIDs.includes(interaction.commandId)) {
            globalCommandHandler.onSlashCommand(interaction)
                .catch(console.error);
        }
        else if (interaction.guildId) {
            guildMap.get(interaction.guildId)
                ?.onSlashCommand(interaction)
                .catch(console.error);
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
            guildMap.get(interaction.guildId)
                ?.onButton(interaction)
                .catch(console.error);

        }
        else {
            dmHandler.onButton(interaction)
                .catch(console.error);
            console.log('dm button received');
        }
    }

    else if (interaction.isSelectMenu()) {
        if (interaction.guildId) {
            guildMap.get(interaction.guildId)
                ?.onSelectMenu(interaction)
                .catch(console.error);
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
                .replace(/(\r\n|\n|\r)/gm, "") //remove all line breaks
                .replace("```", "") //remove code blocks
                .replace("`", "") //remove code quotes
            );

        }
        catch (err) {
            console.error(err);
            receivedMessage.reply({ content: err.toString(), allowedMentions: { parse: [] } })
                .catch(internalErr => console.log(internalErr));
        }

    if (receivedMessage.author.id === PAP.user.id)
        return

    switch (receivedMessage.channel.type) {
        case 'DM':
            dmHandler.onMessage(receivedMessage)
                .catch(console.error);
            break;

        case 'GUILD_TEXT': case 'GUILD_PRIVATE_THREAD': case 'GUILD_PUBLIC_THREAD':
            guildMap.get(receivedMessage.guild.id)
                ?.onMessage(receivedMessage)
                .catch(console.error);
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

    if (deletedMessage.author.id === PAP.user.id || deletedMessage.author.bot)
        return

    switch (deletedMessage.channel.type) {
        case 'DM':
            dmHandler.onMessageDelete(deletedMessage as Message)
                .catch(console.error);
            break;

        case 'GUILD_TEXT': case 'GUILD_PRIVATE_THREAD': case 'GUILD_PUBLIC_THREAD':
            guildMap.get(deletedMessage.guild?.id)
                ?.onMessageDelete(deletedMessage as Message)
                .catch(console.error);
            break;
    }
})

PAP.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return
    const r = reaction.partial ? await reaction.fetch() : reaction;
    const u = user.partial ? await user.fetch() : user;
    switch (reaction.message.channel.type) {
        case 'DM':
            dmHandler.onMessageReactionAdd(r as MessageReaction, u as User)
                .catch(console.error);
            break;

        case 'GUILD_TEXT': case 'GUILD_PRIVATE_THREAD': case 'GUILD_PUBLIC_THREAD':
            guildMap.get(reaction.message.guild?.id)
                ?.onMessageReactionAdd(
                    r as MessageReaction,
                    u as User,
                ).catch(console.error);
            break;

        default:
            bugsChannel.send(`received reaction from untracked channel type
CHANNEL_TYPE: ${reaction.message.channel.type}
ID: ${reaction.message.id}
from: ${reaction.message.member.displayName}
reaction: ${reaction.emoji.name}\n`).catch(console.error);
    }
});

PAP.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return
    const r = reaction.partial ? await reaction.fetch() : reaction;
    const u = user.partial ? await user.fetch() : user;
    switch (reaction.message.channel.type) {
        case 'DM':
            dmHandler.onMessageReactionRemove(r as MessageReaction, u as User)
                .catch(console.error);
            break;

        case 'GUILD_TEXT': case 'GUILD_PRIVATE_THREAD': case 'GUILD_PUBLIC_THREAD':
            guildMap.get(reaction.message.guild?.id)
                ?.onMessageReactionRemove(
                    r as MessageReaction,
                    u as User,
                ).catch(console.error);
            break;
    };
});

PAP.on('guildMemberAdd', (member) => {
    guildMap.get(member.guild.id)
        ?.onGuildMemberAdd(member)
        .catch(console.error);
});

PAP.on('guildMemberRemove', async (member) => {
    const m = member.partial ? await member.fetch() : member;
    guildMap.get(m.guild.id)
        .onGuildMemberRemove(m as GuildMember)
        .catch(console.error);
});

PAP.on('guildMemberUpdate', async (oldMember, newMember) => {
    guildMap.get(newMember.guild.id)
        ?.onGuildMemberUpdate(
            oldMember.partial ? await oldMember.fetch() : oldMember as GuildMember,
            newMember)
        .catch(console.error);
});

PAP.on('guildBanAdd', ban => {
    guildMap.get(ban.guild.id)
        ?.onGuildBanAdd(ban)
        .catch(console.error);
})

PAP.on('guildBanRemove', ban => {
    guildMap.get(ban.guild.id)
        ?.onGuildBanRemove(ban)
        .catch(console.error);
})

PAP.on('error', (error) => {
    console.error(error);
});

PAP.login(process.env.BOT_TOKEN)
    .then(r => console.log(`logged in `))
    .catch(err => console.log(`ERROR ON LOGIN: \n${err}`));


process.on('unhandledRejection', (reason, p) => {
    console.log(reason)
});

