import { ClientEvents, VoiceState } from "discord.js";
import { guilds } from "../..";


const name: keyof ClientEvents = "voiceStateUpdate";

const execute = async (oldState: VoiceState, newState: VoiceState) => {
    guilds.get(newState.guild.id)
        ?.onVoiceStateUpdate(oldState, newState)
        .catch(console.error);
}

export default { name, execute }