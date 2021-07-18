import { Snowflake } from "discord.js";
import { deleteBatch, findAll, saveBatch, update } from "../../../DB/GenericCRUD";
import { userNote } from "../../Entities/Generic/userNote";

export async function addNote(user_id: Snowflake, note: string): Promise<userNote> {
    return await saveBatch('user_notes', [
        {
            "user_id": user_id,
            "note": note,
            "createdAt": new Date().toISOString()
        }
    ])[0]
}

export async function editNote(user_id: Snowflake, old_note: string, new_note: string): Promise<userNote> {
    return await update('user_notes', {
        "user_id": user_id,
        "note": old_note
    }, {
        "user_id": user_id,
        "note": new_note,
        "editedAt": new Date().toISOString()
    })[0]
}

export function deleteNote(user_id: Snowflake, note: string): Promise<number> {
    return deleteBatch('user_notes', {
        "user_id": user_id,
        "note": note
    })
}

export function clearNotes(user_id: Snowflake): Promise<number> {
    return deleteBatch('user_notes', {
        "user_id": user_id
    })
}

export async function fetchAllNotes(user_id: Snowflake): Promise<userNote[]> {
    const notes = await findAll('user_notes', {
        "user_id": user_id
    });
    return notes.map(userNote => userNote['note'])
}