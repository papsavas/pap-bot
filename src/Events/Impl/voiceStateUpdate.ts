import { ClientEvents, VoiceState } from "discord.js";

const name: keyof ClientEvents = "voiceStateUpdate";

const execute = async (oldState: VoiceState, newState: VoiceState) => {
    const { guilds } = await import('../../Inventory/guilds');
    guilds.get(newState.guild.id)
        ?.onVoiceStateUpdate(oldState, newState)
        .catch(console.error);
}

export default { name, execute }