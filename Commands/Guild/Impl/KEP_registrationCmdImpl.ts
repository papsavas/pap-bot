import { ApplicationCommandData, CommandInteraction, Message, Snowflake } from "discord.js";
import { guildMap } from "../../..";
import { literalCommandType } from "../../../Entities/Generic/commandType";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_registrationCmd } from "../Interf/KEP_registrationCmd";

const [registerName, verifyName] = ['register', 'verify'];

export class KEP_registrationCmdImpl extends AbstractGuildCommand implements KEP_registrationCmd {

    protected _id: Snowflake;
    protected _keyword = ``;
    protected _guide = ``;
    protected _usage = ``;
    private constructor() { super() }
    static async init(): Promise<KEP_registrationCmd> {
        const cmd = new KEP_registrationCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    private readonly _aliases = this.addKeywordToAliases
        (
            [], this.keyword
        );
    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            options: [
                {
                    name: registerName,
                    description: "σας αποστέλλει με email τον κωδικό επαλήθευσης",
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: "email",
                            description: "το ακαδημαϊκό σας email",
                            type: "STRING",
                            required: true,
                        }
                    ]
                },
                {
                    name: verifyName,
                    description: "επαληθεύει το κωδικό αποστολής σας",
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: "password",
                            description: "ο κωδικός επαλήθευσης σας",
                            type: "STRING",
                            required: true,
                        }
                    ]
                }
            ]
        }
    }
    async interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
        const cmdOptions = interaction.options[0].options;
        switch (interaction.options[0].name) {
            case registerName:

                break;

            case verifyName:

                break;

            default:
                return new Error(`returned wrong subcommand on KEP_registration: ${interaction.options[0].name} `);

        }
    }
    async execute(message: Message, { }: literalCommandType): Promise<unknown> {
        return Promise.reject('manual KEPregistration not implemented');
    }
    getAliases(): string[] {
        return this._aliases;
    }
    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}