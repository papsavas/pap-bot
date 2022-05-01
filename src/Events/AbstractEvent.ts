import { ClientEvents } from "discord.js";
import GenericEvent from "./GenericEvent";

export default abstract class AbstractEvent implements GenericEvent {
    #name: keyof ClientEvents = null;

    get name() {
        return this.#name;
    }

    protected set name(name: keyof ClientEvents) {
        this.#name = name;
    }

    abstract execute<K extends keyof ClientEvents>(...args: ClientEvents[K]): Promise<unknown>;
}