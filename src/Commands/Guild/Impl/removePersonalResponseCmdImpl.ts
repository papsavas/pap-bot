import { ApplicationCommandData, ApplicationCommandOptionData, CommandInteraction, GuildMember, Message, Snowflake } from 'discord.js';
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { guildMap } from "../../../index";
import { fetchCommandID } from '../../../Queries/Generic/Commands';
import { removeMemberResponse } from "../../../Queries/Generic/MemberResponses";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { removePersonalResponseCmd } from "../Interf/removePersonalResponseCmd";


const respOptionLiteral: ApplicationCommandOptionData['name'] = 'response';
export class RemovePersonalResponseCmdImpl extends AbstractGuildCommand implements removePersonalResponseCmd {

    protected _id: Snowflake;
    protected _keyword = `removeresponse`;
    protected _guide = `Removes an added response`;
    protected _usage = `removeresponse <response>`;
    private constructor() { super() }

    static async init(): Promise<removePersonalResponseCmd> {
        const cmd = new RemovePersonalResponseCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }

    private readonly _aliases = this.addKeywordToAliases
        (
            ['removeresponse', 'rresponse', 'remove_response', 'rr'],
            this.keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            options: [
                {
                    name: respOptionLiteral,
                    description: 'exact personal response',
                    type: 'STRING',
                    required: true
                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        const { guildId, member, options } = interaction;
        return interaction.reply({
            content: await removeMemberResponse(
                guildId, (member as GuildMember).id,
                options.get(respOptionLiteral).value as string
            ),
            ephemeral: true
        }
        );
    }

    async execute(message: Message, { commandless1 }: literalCommandType) {
        return message.reply(await removeMemberResponse(message.guild.id, message.member.id, commandless1));
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}
