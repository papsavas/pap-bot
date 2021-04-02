import {of} from 'rxjs';
import {filter, tap} from 'rxjs/operators';
import * as Discord from 'discord.js';
import {bundle} from './index'
import container from './Inversify/inversify.config';
import {CommandHandler} from './Commands/CommandHandler';
import {mentionRegex, prefix, qprefix} from './botconfig.json'
import {TYPES} from "./Inversify/Types";

const commandHandler = container.get<CommandHandler>(TYPES.CommandHandler)


export function onMessage(message: Discord.Message) {
    bundle.setMessage(message);

    if ( [prefix, qprefix].some((pr :string) => message.content.startsWith(pr)) ){
        commandHandler.onCommand();
    }

    if(message.content.match(mentionRegex)){
        //call mentionHandler
        message.reply('Έγινε κάποια αναφορά στο άτομό μου;')
            .then(msg=> msg.delete({timeout:5000, reason:`testing reply`}))
                .catch(err=> console.log(err));
    }

}

export function onMessageDelete(deletedMessage: Discord.Message | Discord.PartialMessage) {
    if (deletedMessage.partial) deletedMessage.fetch().then(msg => bundle.setMessage(msg));
    of(bundle.getMessage()).pipe(
        filter(deletedMessage => !deletedMessage.partial),

        tap(deletedMessage => {
            console.log(`deleted message with id: ${deletedMessage.id}`)
        })
    );
}
