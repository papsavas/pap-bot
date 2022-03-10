import { ClientEvents, VoiceState } from "discord.js";
import { guildMap } from "../..";


const name: keyof ClientEvents = "voiceStateUpdate";

const execute = async (oldState: VoiceState, newState: VoiceState) => {
    guildMap.get(newState.guild.id)
        ?.onVoiceStateUpdate(oldState, newState)
        .catch(console.error);
}

export default { name, execute }