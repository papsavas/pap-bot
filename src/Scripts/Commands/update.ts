import { argv } from "process";
import { PAP } from "../../index";

const guildId = argv[2];

if (guildId && PAP.guilds.cache.has(guildId)) {
    //while (!guilds.get(guildId).guild)
    //  setTimeout(() => { `${new Date().toISOString()} -> ${guilds.size}` }, 4000);
    const { guilds } = await import('../../Inventory/guilds');
    const g = guilds.get(guildId);
    console.log(`updating ${g.guild.name} (/) commands...`);
    g.commandManager.updateCommands(g.guild.commands);
}
else if (!guildId) {
    console.log('updating global (/) commands...');
    const { globalCommandHandler } = await import('../../Inventory/globalCommandHandler');
    globalCommandHandler.commandManager.updateCommands(PAP.application.commands);
}
else throw new Error('invalid guild id');
