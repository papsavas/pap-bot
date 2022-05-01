import { calendar_v3, google } from 'googleapis';
import { googleCredentials, googleToken } from '../../Entities/Generic/secrets';
import { Gauth } from './Gauth';
export { fetchCalendarEvents, insertCalendarEvent };

if (process.env.NODE_ENV !== 'production')
    (await import('dotenv'))
        .config({ path: (await import('find-config')).read('.env') })  //load env variables

const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.events.readonly',

];

const maxResults: number = 300;

const credentials: googleCredentials = {
    installed: {
        client_id: process.env.GCALENDAR_CLIENT_ID,
        project_id: process.env.GCALENDAR_PROJECT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_secret: process.env.GCALENDAR_CLIENT_SECRET,
        redirect_uris: [
            "urn:ietf:wg:oauth:2.0:oob",
            "http://localhost"
        ]
    }
};

const token: googleToken = {
    access_token: process.env.GCALENDAR_ACCESS_TOKEN,
    refresh_token: process.env.GCALENDAR_REFRESH_TOKEN,
    "scope": "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/calendar.events",
    "token_type": "Bearer",
    "expiry_date": 1640557954633
}

const authP = Gauth(credentials, token, SCOPES);

async function fetchCalendarEvents(past = false) {
    const calendar = google.calendar({ version: "v3", auth: await authP });
    const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: past ? undefined : (new Date()).toISOString(),
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime',
    });
    return res.status === 200 ? res.data.items ?? [] : Promise.reject(res.statusText);
}

async function insertCalendarEvent(options: calendar_v3.Schema$Event, user?: string) {
    const calendar = google.calendar({ version: "v3", auth: await authP });
    return calendar.events.insert(
        {
            calendarId: 'primary',
            requestBody: options,
            quotaUser: user?.substring(0, 40)
        }
    );
}