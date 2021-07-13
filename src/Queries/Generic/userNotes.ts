import { Snowflake, SnowflakeUtil } from "discord.js";
import { addRow, dropRows, fetchAllOnCondition, updateRow } from "../../../DB/CoreRepo";
import { userNote } from "../../Entities/Generic/userNote";

export function addNote(user_id: Snowflake, note: string): Promise<userNote> {
    return addRow('user_notes', {
        "user_id": user_id,
        "note": note,
        "createdAt": new Date().toISOString()
    }, ['*'])
}

export function editNote(user_id: Snowflake, old_note: string, new_note: string): Promise<userNote> {
    return updateRow('user_notes', {
        "user_id": user_id,
        "note": old_note
    }, {
        "user_id": user_id,
        "note": new_note,
        "editedAt": new Date().toISOString()
    }, ["*"])
}

export function deleteNote(user_id: Snowflake, note: string): Promise<number> {
    return dropRows('user_notes', {
        "user_id": user_id,
        "note": note
    })
}

export function clearNotes(user_id: Snowflake): Promise<number> {
    return dropRows('user_notes', {
        "user_id": user_id
    })
}

export async function fetchAllNotes(user_id: Snowflake): Promise<userNote[]> {
    const notes = await fetchAllOnCondition('user_notes', {
        "user_id": user_id
    });
    return notes.map(note => note.note)
}