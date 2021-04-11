import * as Discord from 'discord.js';
import {AbstractGuild} from "../AbstractGuild";
import {GenericGuild} from "../GenericGuild";
import {mentionRegex, prefix, qprefix} from "../../botconfig.json";
import container from "../../Inversify/inversify.config";
import {CommandHandler} from "../../Commands/CommandHandler";
import {TYPES} from "../../Inversify/Types";

const commandHandler = container.get<CommandHandler>(TYPES.CommandHandler);

export class DefaultGuild extends AbstractGuild implements GenericGuild {

    onMessage(message: Discord.Message): Promise<any> {
        if ([prefix, qprefix].some((pr: string) => message.content.startsWith(pr))) {
            return commandHandler.onCommand();
        }

        if (message.content.match(mentionRegex)) {
            //call mentionHandler
            message.reply('Έγινε κάποια αναφορά στο άτομό μου;\nDefault Guild')
                .then(msg => msg.delete({timeout: 5000, reason: `testing reply`}))
                .catch(err => console.log(err));
        }
    }
}