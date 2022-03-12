import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData, ChatInputCommandInteraction, Collection, Message, Snowflake } from 'discord.js';
import { commandLiteral } from "../../../Entities/Generic/command";
import { UserNote } from '../../../Entities/Generic/userNote';
import { fetchCommandID } from '../../../Queries/Generic/Commands';
import { addNote, clearNotes, deleteNote, editNote, fetchAllNotes } from '../../../Queries/Generic/userNotes';
import { AbstractGlobalCommand } from '../AbstractGlobalCommand';
import { userNotesCmd } from '../Interf/userNotesCmd';



export class userNotesCmdImpl extends AbstractGlobalCommand implements userNotesCmd {

    id: Collection<Snowflake, Snowflake> = new Collection(null);
    readonly keyword = `notes`;
    readonly guide = `Your personal notes`;
    readonly usage = `${this.keyword} add <note> / remove <index> / edit <index> <note> / clear / show`;

    private constructor() { super() }

    static async init(): Promise<userNotesCmd> {
        const cmd = new userNotesCmdImpl();
        cmd.id = await fetchCommandID(cmd.keyword);
        return cmd;
    }


    readonly aliases = this.mergeAliases
        (
            ['notes', 'note', 'mynotes', 'my_notes'],
            this.keyword
        );

    getCommandData(): ChatInputApplicationCommandData {
        return {
            name: this.keyword,
            description: this.guide,
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: "add",
                    description: "add a note",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "note",
                            description: "your note",
                            required: true,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: "edit",
                    description: "edit note",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "old_note",
                            description: "the note you want to edit",
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: "new_note",
                            description: "your edited note",
                            required: true,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: "remove",
                    description: "remove a note",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "note",
                            description: "the note you want to remove",
                            required: true,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: "show",
                    description: "show your notes",
                    type: ApplicationCommandOptionType.Subcommand
                },
                {
                    name: "clear",
                    description: "clear all your notes",
                    type: ApplicationCommandOptionType.Subcommand
                }
            ]
        }
    }

    async interactiveExecute(interaction: ChatInputCommandInteraction): Promise<any> {
        if (!interaction.channel.isDM())
            return interaction.reply({
                content: `For security reasons, please use this command in DMs`,
                ephemeral: true
            })
        await interaction.deferReply({ ephemeral: true });
        const user_id = interaction.user.id;
        const subCommand = interaction.options.getSubcommand();
        const noteOption = interaction.options.getString('note');
        const oldNoteOption = interaction.options.getString('old_note');
        const newNoteOption = interaction.options.getString('new_note');
        try {
            switch (subCommand) {
                case 'add': {
                    const addedNote = noteOption;
                    const notes = await addNote(user_id, addedNote);
                    return interaction.editReply({
                        content: `added \`\`\`${notes[0].note}\`\`\``
                    });
                }
                case 'edit': {
                    const oldNote = oldNoteOption;
                    const newNote = newNoteOption;
                    const res = await editNote(user_id, oldNote, newNote);
                    return interaction.editReply({
                        content: `note edited to ${res[0].note.substr(0, 1000)}...`
                    });
                }
                case 'remove': {
                    const removingNote = noteOption;
                    const n = await deleteNote(user_id, removingNote);
                    return interaction.editReply(`removed **${n}** notes`);
                }

                case 'clear': {
                    return interaction.editReply(`Removed **${await clearNotes(user_id)}** notes`);
                }
                case 'show': {
                    const notes: UserNote[] = await fetchAllNotes(user_id);
                    return await interaction.editReply(`here are your notes\n\`\`\`${notes.toString()}\`\`\``);
                }

                case 'default':
                    return new Error(`returned wrong subcommand on notes: ${interaction.options.getSubcommand()} `);
            }
        } catch (error) {
            return interaction.replied ? interaction.editReply(`\`\`\`${JSON.stringify(error)}\`\`\``) :
                interaction.editReply(`\`\`\`${JSON.stringify(error)}\`\`\``)
        }


    }

    async execute(message: Message, { arg1, args2 }: commandLiteral) {
        const { author } = message
        if (!message.channel.isDM())
            return message.reply({
                content: `For security reasons, please use this command in DMs`
            })
        const user_id = author.id;
        const user = author;
        console.log(arg1);
        switch (arg1) {
            case 'add':
                const addedNote = args2.trimStart().trimEnd();
                await addNote(user_id, addedNote);
                return user.send(`you added: \`\`\`${addedNote}\`\`\``);

            case 'edit':
                const [oldNote, newNote] = args2.split('|', 2);
                const res = await editNote(user_id, oldNote.trimStart().trimEnd(), newNote.trimStart().trimEnd());
                return user.send(res[0].note ? `note edited to \`${res[0].note?.substr(0, 10)}...\`` : `note \`${oldNote.trimStart().trimEnd()}\` does not exist`);

            case 'remove':
                const removingNote = args2.trimStart().trimEnd();
                const n = await deleteNote(user_id, removingNote);
                return user.send(`removed **${n}** notes`);


            case 'clear':
                return user.send(`Removed **${await clearNotes(user_id)}** notes`);

            case 'show':
                const notes: UserNote[] = await fetchAllNotes(user_id);
                return user.send(`here are your notes\n\`\`\`${notes.toString()}\`\`\``);

            case undefined:
            case '':
            default:
                throw new Error(`Invalid parameter: "**${arg1}**". Available options are listed above`);
        }
    }




}