//WIP

import { Snowflake, Message, GuildChannel } from 'discord.js';
import { KEP_announceCmdImpl } from '../../../Commands/Guild/Impl/KEP_announceCmdImpl';
import { GuildCommandManagerImpl } from '../../../Commands/Managers/Impl/GuildCommandManagerImpl';
import { sendEmail } from '../../../toolbox/Google/Gmail';
import { AbstractGuild } from "../AbstractGuild";
import { GenericGuild } from "../GenericGuild";

const specifiedCommands = [KEP_announceCmdImpl]; //add guild specific commands
export class KepGuild extends AbstractGuild implements GenericGuild {
    private constructor(id: Snowflake) {
        super(id);
    }

    static async init(guild_id: Snowflake): Promise<GenericGuild> {
        const guild = new KepGuild(guild_id);
        guild.specifiedCommands = specifiedCommands.map(cmd => cmd.init());
        guild.commandManager = new GuildCommandManagerImpl(
            guild_id,
            await Promise.all(
                guild._genericCommands
                    .concat(guild.specifiedCommands ?? [])) //merge specified commands if any

        );
        return guild;
    }

    onMessage(message: Message): Promise<any> {
        if ((message.channel as GuildChannel).parentID == 'registration_Category_id') {
            return this.registration(message);
        }
    }


    async registration(message: Message): Promise<unknown> {
        if (message.channel.id == 'send_email') {
            const email = message.cleanContent//.match(/*emailRegex*/)
            return email ? emailStudent(email) : message.react('❌');
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
