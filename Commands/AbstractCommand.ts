import {injectable} from "inversify";
import {GenericCommand} from "./GenericCommand";
import "reflect-metadata";
import Bundle from "@root/EntitiesBundle/Bundle";
import * as Discord from 'discord.js';
import {bugsChannel, logsChannel} from "@root/index";

@injectable()
export abstract class AbstractCommand implements GenericCommand {
    constructor(aliases: string[], keyword: string) {
        if (aliases.every(alias => alias !== keyword))
            aliases.push(keyword)
    }

    abstract execute(bundle: Bundle): Promise<any>;

    abstract getKeyword(): string;

    abstract getAliases(): string[];

    abstract getGuide(): string;

    matchAliases(possibleCommand: string): boolean {
        return !!this.getAliases()
            .find((alias: string) => alias === possibleCommand.toLowerCase());
    }

    handleError(err: Error, bundle: Bundle) {
        const emb = new Discord.MessageEmbed({
            author: {
                name: bundle.getGuild().name,
                icon_url: "https://icon-library.com/images/error-icon-transparent/error-icon-transparent-13.jpg"
            },
            thumbnail:{
                proxy_url: bundle.getGuild().iconURL({format:"png", size:512})
            },
            title: bundle.getCommand().primaryCommand,
            color: "DARK_RED",
            timestamp : new Date()

        })
        emb.setDescription(`\`\`\`${err}\`\`\``)
        bugsChannel.send(emb).catch(internalErr => console.log(internalErr));
    }
}