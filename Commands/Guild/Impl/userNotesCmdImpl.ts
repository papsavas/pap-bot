import * as Discord from 'discord.js';
import { ApplicationCommandData, Message, TextChannel } from 'discord.js';
import { userNotes as _keyword } from '../../keywords.json';
import { GuserNotes as _guide } from '../../guides.json';

import { AbstractCommand } from "../AbstractCommand";
import { commandType } from "../../../Entities/Generic/commandType";
import { guildLoggerType } from "../../../Entities/Generic/guildLoggerType";
import { userNotesCmd } from '../Interf/userNotesCmd';


export class userNotesCmdImpl extends AbstractCommand implements userNotesCmd {
    private readonly _aliases = this.addKeywordToAliases
        (
            ['notes', 'note', 'mynotes', 'my_notes'],
            _keyword
        );

    getCommandData(): ApplicationCommandData {
        return {
            name: _keyword,
            description: this.getGuide(),
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
                            name: "index",
                            description: "note index",
                            required: true,
                            type: 'INTEGER'
                        },
                        {
                            name: "note",
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
                            name: "index",
                            description: "index of note",
                            required: true,
                            type: "INTEGER"
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

    async interactiveExecute(interaction: Discord.CommandInteraction): Promise<any> {
        await interaction.defer(true);
        console.log(JSON.stringify(interaction.options));
        switch (interaction.options[0].name) {
            case 'add':
                return interaction.editReply(`you added: ${interaction.options[0].options[0].value}`);

            case 'edit':

                return interaction.editReply(`you edited __ to __`);

            case 'remove':
                return interaction.editReply(`you removed __`)
                

            case 'clear':
                return interaction.editReply(`Cleared all notes`);

            case 'show':
                return interaction.editReply(`here are your notes __`);

            case 'default':
                return new Error(`returned wrong subcommand on notes: ${interaction.options[0].name}`);
        }

    }

    async execute({ author }: Message, { commandless2 }: commandType, addGuildLog: guildLoggerType) {
        return author.send('no notes found');
    }

    getAliases(): string[] {
        return this._aliases;
    }

    getGuide(): string {
        return _guide;
    }

    getKeyword(): string {
        return _keyword;
    }
}