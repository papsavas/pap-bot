import {of} from 'rxjs';
import {filter, tap} from 'rxjs/operators';
import * as Discord from 'discord.js';
import {bundle} from './index'
import container from './Inversify/inversify.config';
import {CommandHandler} from './Commands/CommandHandler';
import {TYPES} from './Inversify/Types';

const commandHandler = container.get<CommandHandler>(TYPES.CommandHandler)


export function onMessage(message: Discord.Message) {
    bundle.setMessage(message);
    if (message.content.startsWith('$') || message.content.startsWith('?'))
        commandHandler.onCommand();

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
