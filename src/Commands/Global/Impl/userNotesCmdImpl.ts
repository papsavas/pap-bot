import { ChatInputApplicationCommandData, CommandInteraction, Message, Snowflake } from 'discord.js';
import { commandLiteral } from "../../../Entities/Generic/command";
import { userNote } from '../../../Entities/Generic/userNote';
import { guildMap } from '../../../index';
import { fetchCommandID } from '../../../Queries/Generic/Commands';
import { addNote, clearNotes, deleteNote, editNote, fetchAllNotes } from '../../../Queries/Generic/userNotes';
import { AbstractGlobalCommand } from '../AbstractGlobalCommand';
import { userNotesCmd } from '../Interf/userNotesCmd';



export class userNotesCmdImpl extends AbstractGlobalCommand implements userNotesCmd {

    protected _id: Snowflake;
    protected _keyword = `notes`;
    protected _guide = `Your personal notes`;
    protected _usage = `notes add <note> / remove <index> / edit <index> <note> / clear / show`;

    private constructor() { super() }

    static async init(): Promise<userNotesCmd> {
        const cmd = new userNotesCmdImpl();
        cmd._id = await fetchCommandID(cmd.keyword);
        return cmd;
    }


    private readonly _aliases = this.addKeywordToAliases
        (
            ['notes', 'note', 'mynotes', 'my_notes'],
            this.keyword
        );

    getCommandData(): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: 'CHAT_INPUT',
            options: [
                {
                    name: "add",
                    description: "add a note",
                    type: 'SUB_COMMAND',
                    options: [
                        {
                            name: "note",
                            description: "your note",
                            required: true,
                            type: 'STRING'
                        }
                    ]
                },
                {
                    name: "edit",
                    description: "edit note",
                    type: 'SUB_COMMAND',
                    options: [
                        {
                            name: "old_note",
                            description: "the note you want to edit",
                            required: true,
                            type: 'STRING'
                        },
                        {
                            name: "new_note",
                            description: "your edited note",
                            required: true,
                            type: 'STRING'
                        }
                    ]
                },
                {
                    name: "remove",
                    description: "remove a note",
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: "note",
                            description: "the note you want to remove",
                            required: true,
                            type: "STRING"
                        }
                    ]
                },
                {
                    name: "show",
                    description: "show your notes",
                    type: 'SUB_COMMAND'
                },
                {
                    name: "clear",
                    description: "clear all your notes",
                    type: 'SUB_COMMAND'
                }
            ]
        }
    }

    async interactiveExecute(interaction: CommandInteraction): Promise<any> {
        await interaction.deferReply({ ephemeral: true });
        const user_id = interaction.user.id;
        const subCommand = interaction.options.getSubcommand();
        const options = interaction.options.get(subCommand).options;
        try {
            switch (subCommand) {
                case 'add':
                    const addedNote = options[0].value as string;
                    await addNote(user_id, addedNote);
                    return interaction.editReply(`you added: ${addedNote}`);

                case 'edit':
                    const oldNote = options[0].value as string;
                    const newNote = options[1].value as string;
                    const res = await editNote(user_id, oldNote, newNote);
                    return interaction.editReply(`note edited to ${res.note.substr(0, 10)}...`);

                case 'remove':
                    const removingNote = options[0].value as string;
                    const n = await deleteNote(user_id, removingNote);
                    return interaction.editReply(`removed **${n}** notes`);


                case 'clear':
                    return interaction.editReply(`Removed **${await clearNotes(user_id)}** notes`);

                case 'show':
                    const notes: userNote[] = await fetchAllNotes(user_id);
                    return await interaction.editReply(`here are your notes\n\`\`\`${notes.toString()}\`\`\``);


                case 'default':
                    return new Error(`returned wrong subcommand on notes: ${interaction.options.getSubcommand()} `);
            }
        } catch (error) {
            return interaction.replied ? interaction.editReply(`\`\`\`${JSON.stringify(error)}\`\`\``) :
                interaction.reply(`\`\`\`${JSON.stringify(error)}\`\`\``)
        }


    }

    async execute({ author }: Message, { arg1, commandless2 }: commandLiteral) {
        const user_id = author.id;
        const user = author;
        console.log(arg1);
        switch (arg1) {
            case 'add':
                const addedNote = commandless2.trimStart().trimEnd();
                await addNote(user_id, addedNote);
                return user.send(`you added: \`\`\`${addedNote}\`\`\``);

            case 'edit':
                const [oldNote, newNote] = commandless2.split('|', 2);
                const res = await editNote(user_id, oldNote.trimStart().trimEnd(), newNote.trimStart().trimEnd());
                return user.send(res[0].note ? `note edited to \`${res[0].note?.substr(0, 10)}...\`` : `note \`${oldNote.trimStart().trimEnd()}\` does not exist`);

            case 'remove':
                const removingNote = commandless2.trimStart().trimEnd();
                const n = await deleteNote(user_id, removingNote);
                return user.send(`removed **${n}** notes`);


            case 'clear':
                return user.send(`Removed **${await clearNotes(user_id)}** notes`);

            case 'show':
                const notes: userNote[] = await fetchAllNotes(user_id);
                return user.send(`here are your notes\n\`\`\`${notes.toString()}\`\`\``);

            case undefined:
            case '':
            default:
                throw new Error(`Invalid parameter: "**${arg1}**". Available options are listed above`);
        }
    }

    getAliases(): string[] {
        return this._aliases;
    }

    addGuildLog(guildID: Snowflake, log: string) {
        return guildMap.get(guildID).addGuildLog(log);
    }
}