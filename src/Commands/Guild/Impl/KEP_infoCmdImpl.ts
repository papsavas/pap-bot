import { ApplicationCommandData, ApplicationCommandOptionData, Collection, CommandInteraction, Message, Snowflake } from "discord.js";
import { guildMap } from "../../..";
import * as i from "../../../../values/KEP/info.json";
import { commandLiteral } from "../../../Entities/Generic/command";
import { fetchCommandID } from "../../../Queries/Generic/Commands";
import { AbstractGuildCommand } from "../AbstractGuildCommand";
import { KEP_infoCmd } from "../Interf/KEP_infoCmd";

const infoLiteral: ApplicationCommandOptionData['name'] = "πληροφορια";
const targetLiteral: ApplicationCommandOptionData['name'] = "target"

export class KEP_infoCmdImpl extends AbstractGuildCommand implements KEP_infoCmd {

    protected _id: Collection<Snowflake, Snowflake>;
    protected _keyword = `info`;
    protected _guide = `Εμφανίζει διάφορες πληροφορίες σχετικά με τη σχολή`;
    protected _usage = `info <πληροφορία>`;

    private constructor() { super() }

    static async init(): Promise<KEP_infoCmd> {
        const cmd = new KEP_infoCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }
    private readonly _aliases = this.addKeywordToAliases
        (
            ["info", "i"], this.keyword
        );

    getCommandData(guild_id: Snowflake): ApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: infoLiteral,
                    description: "Επιλέγετε ένα από τα εμφανιζόμενα",
                    type: "STRING",
                    required: true,
                    choices: i.values.map(i => ({ name: i.name, value: i.name }))
                },
                {
                    name: targetLiteral,
                    description: "Χρήστης που απευθύνεται η πληροφορία",
                    type: "USER",
                    required: false
                }
            ]
        }
    }

    interactiveExecute(interaction: CommandInteraction): Promise<unknown> {
        const i = interaction.options.getString(infoLiteral, true);
        const user = interaction.options.getUser(targetLiteral, false);
        return interaction.reply({
            content: `${user?.toString() ?? ''}\n${fetchInfo(i)}`,
            ephemeral: !user
        })
    }

    execute(message: Message, { arg1 }: commandLiteral): Promise<unknown> {
        const i = fetchInfo(arg1);
        return message.reply(i);
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}

function fetchInfo(query: string): string {
    //TODO: convert to non diacritics || 
    //TODO: access values from json
    switch (query.toLowerCase().trim()) {
        case "πρόγραμμα_εξεταστικής":
        case "προγραμμα_εξεταστικης":
        case "programma_exetastikis":
        case "programma_eksetastikis":
            return i.exams;

        case "πρόγραμμα_διδασκαλίας":
        case "προγραμμα_διδασκαλιας":
        case "programma_didaskalias":
        case "programma_didaskalias":
            return i.schedule;

        case "πρόγραμμα_σπουδών":
        case "προγραμμα_σπουδων":
        case "programma_spoudwn":
            return i.curriculum;

        case "drive": case "gdrive":
        case "daiarchive": case "dai_archive":
        case "archive":
            return i.drive;

        case "faq": case "f.a.q":
            return i.faq

        case "ακαδημαϊκό_ημερολόγιο":
        case "ακαδημαικο_ημερολογιο":
        case "akadhmaiko_hmerologio":
        case "ημερολόγιο":
        case "ημερολογιο":
        case "hmerologio":
            return i.calendar;

        case "bible":
        case "βιβλος":
        case "βίβλος":
            return i.bible;

        default:
            return `Δεν βρέθηκε \`${query}\``
    }

}
