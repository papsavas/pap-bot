import { google } from 'googleapis';
import { googleCredentials, googleToken } from '../../Entities/Generic/secrets';
import { Gauth } from './Gauth';
require('dotenv').config({ path: require('find-config')('.env') })

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const maxResults: number = 300;


export async function fetchEvents(past = false) {
    const credentials: googleCredentials = {
        installed: {
            client_id: process.env.GCALENDAR_CLIEND_ID,
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
        scope: "https://www.googleapis.com/auth/calendar.readonly",
        token_type: "Bearer",
        expiry_date: 1591354563667
    }

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