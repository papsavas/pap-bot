import { argv } from "process";

const guildId = argv[2];

if (guildId) {
    const { guilds } = await import("../../Inventory/guilds");
    const g = guilds.get(guildId);
    console.log(`clearing ${g.guild.name} (/) commands...`);
    g.commandManager.clearCommands(g.guild.commands);
}
else {
    console.log('clearing global (/) commands...');
    const { PAP } = await import('../../index');
    const { globalCommandHandler } = await import('../../Inventory/globalCommandHandler');
    globalCommandHandler.commandManager.clearCommands(PAP.application.commands);

}