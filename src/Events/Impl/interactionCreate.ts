import { ChannelType, ClientEvents, EmbedBuilder, Interaction } from "discord.js";
import { bugsChannel, dmHandler, globalCommandHandler, globalCommandsIDs, guilds } from "../..";



const name: keyof ClientEvents = "interactionCreate";

const execute = async (interaction: Interaction) => {
    if (interaction.isCommand()) {
        if (globalCommandsIDs.includes(interaction.commandId)) {
            globalCommandHandler.onCommand(interaction)
                .catch(console.error);
        }
        else if (interaction.channel.type === ChannelType.GuildText) {
            guilds.get(interaction.guildId)
                ?.onCommand(interaction)
                .catch(console.error);
        }
        else if (interaction.channel.isDMBased()) {
            dmHandler.onCommand(interaction)
                .catch(console.error);
        }
        else {
            console.log(`unspecified interaction channel type\n${interaction.toJSON()}`)
        }
    }

    else if (interaction.isButton()) {
        if (interaction.guildId) {
            guilds.get(interaction.guildId)
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
            guilds.get(interaction.guildId)
                ?.onSelectMenu(interaction)
                .catch(console.error);
        }
        else if (interaction.channel.isDMBased()) {
            dmHandler.onSelectMenu(interaction)
                .catch(console.error);
            console.log('dm select received');
        }
    }

    else {
        console.log(`unhandled interaction type in ${interaction.channel.id} channel.TYPE = ${interaction.type}`);
        await bugsChannel.send({
            embeds: [
                new EmbedBuilder({
                    title: `Untracked Interaction`,
                    description: `received untracked interaction in ${interaction.guild.name}`,
                    fields: [
                        { name: `Type`, value: interaction.type.toString() },
                        { name: `Channel`, value: interaction.channel.toString() },
                        { name: `Interaction ID`, value: interaction.id }
                    ]
                })
            ]
        })
    }
}


export default { name, execute };