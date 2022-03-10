import { ClientEvents } from "discord.js";
import { Guilds } from "../Entities/Generic/Guilds";
import { DmHandler } from "../Handlers/DMs/GenericDm";
import { GlobalCommandHandler } from "../Handlers/Global/GlobalCommandHandler";
import GenericEvent from "./GenericEvent";

export default abstract class AbstractEvent implements GenericEvent {
    protected guilds: Guilds = null;
    protected globalHandler: GlobalCommandHandler = null;
    protected dmHandler: DmHandler = null;
    #name: keyof ClientEvents = null;
    constructor(guilds: Guilds, globalHandler: GlobalCommandHandler, dmHandler: DmHandler) {
        this.guilds = guilds;
        this.globalHandler = globalHandler;
        this.dmHandler = dmHandler;
    }

    get name() {
        return this.#name;
    }

    protected set name(name: keyof ClientEvents) {
        this.#name = name;
    }

    abstract execute<K extends keyof ClientEvents>(...args: ClientEvents[K]): Promise<unknown>;
}