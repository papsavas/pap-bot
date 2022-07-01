import { Snowflake } from "discord.js";
import * as dbLiterals from '../../../values/generic/DB.json' assert { type: 'json' };
import { deleteBatch, findAll, saveBatch, updateAll } from "../../DB/GenericCRUD";
import { UserNote } from "../../Entities/Generic/userNote";
const { userNotesTable } = dbLiterals;

async function addNote(user_id: Snowflake, note: string): Promise<UserNote[]> {
    return saveBatch(userNotesTable, [
        {
            "user_id": user_id,
            "note": note,
            "createdAt": new Date().toISOString()
        }
    ])
}

async function editNote(user_id: Snowflake, old_note: string, new_note: string): Promise<UserNote[]> {
    return updateAll(userNotesTable, {
        "user_id": user_id,
        "note": old_note
    }, {
        "user_id": user_id,
        "note": new_note,
        "editedAt": new Date().toISOString()
    })
}

function deleteNote(user_id: Snowflake, note: string): Promise<number> {
    return deleteBatch(userNotesTable, {
        "user_id": user_id,
        "note": note
    })
}

function clearNotes(user_id: Snowflake): Promise<number> {
    return deleteBatch(userNotesTable, {
        "user_id": user_id
    })
}

async function fetchAllNotes(user_id: Snowflake): Promise<UserNote[]> {
    const notes = await findAll(userNotesTable, {
        "user_id": user_id
    });
    return notes.map(userNote => userNote['note'])
}

export { addNote, editNote, deleteNote, clearNotes, fetchAllNotes };

