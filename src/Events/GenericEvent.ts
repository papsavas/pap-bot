import { ClientEvents } from "discord.js";

export default interface GenericEvent {
    name: keyof ClientEvents,
    execute: <K extends keyof ClientEvents> (...args: ClientEvents[K]) => Promise<unknown>,
}