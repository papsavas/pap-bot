import { google } from 'googleapis';
import { googleCredentials, googleToken } from '../../Entities/Generic/secrets';
import { Gauth } from './Gauth';

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const maxResults: number = 300;

export async function fetchEvents(past = false) {
    const credentials: googleCredentials = null;
    const token: googleToken = null;
    const auth = await Gauth(credentials, token, SCOPES);
    const calendar = google.calendar({ version: "v3", auth: auth });
    const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: past ? undefined : (new Date()).toISOString(),
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime',
    });
    return res.status === 200 ? res.data.items ?? [] : Promise.reject(res.statusText);
}