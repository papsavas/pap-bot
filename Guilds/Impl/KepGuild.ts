import * as Discord from 'discord.js';
import { sendEmail } from '../../toolbox/Google/Gmail';
import { AbstractGuild } from "../AbstractGuild";
import { GenericGuild } from "../GenericGuild";

export class KepGuild extends AbstractGuild implements GenericGuild {
    constructor(id: Discord.Snowflake) {
        super(id);
    }

    onMessage(message: Discord.Message): Promise<any> {
        if ((message.channel as Discord.GuildChannel).parentID == 'registration_Cagegory_id') {
            return this.registration(message);
        }
    }


    async registration(message: Discord.Message): Promise<any> {
        if (message.channel.id == 'send_email') {
            const email = message.cleanContent//.match(/*emailRegex*/)
            return email ? await emailStudent(email) : message.react('❌');
        }
        else if (message.channel.id == 'verification') {

        }
    }
}

async function emailStudent(email: string) {
    //await save rand number with email
    return sendEmail(
        email,
        "Επαλήθευση Λογαριασμού",
        "Προσθέστε αυτόν τον αριθμό..."
    )
}