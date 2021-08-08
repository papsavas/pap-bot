import { google } from 'googleapis';
import { googleCredentials, googleToken } from '../../Entities/Generic/secrets';
import { Gauth } from './Gauth';
require('dotenv').config({ path: require('find-config')('.env') })

const SCOPES = [
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.send'
];

//TODO: use email options
//TODO: add sender parameter
export async function sendEmail(email_addr: string, subject: string, message: string) {
    const to = email_addr;
    const subj = subject;
    const msg = message;

    const CREDENTIALS: googleCredentials = {
        installed: {
            client_id: process.env.GMAIL_CLIENT_ID,
            project_id: process.env.GMAIL_PROJECT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_secret: process.env.GMAIL_CLIENT_SECRET,
            redirect_uris: [
                "urn:ietf:wg:oauth:2.0:oob",
                "http://localhost"
            ]
        }
    }

    const TOKEN: googleToken = {
        access_token: process.env.GMAIL_ACCESS_TOKEN,
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
        scope: "https://www.googleapis.com/auth/gmail.compose https://mail.google.com/ https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify",
        token_type: "Bearer",
        expiry_date: 1594844800997
    };

    const auth = await Gauth(CREDENTIALS, TOKEN, SCOPES);
    return send(auth, { to, subj, msg });

}
function send(auth, data) {
    const raw = makeBody(data.to, data.from, data.subj, data.msg);
    const gmail = google.gmail({
        version: "v1"
    });

    return gmail.users.messages.send({
        auth: auth,
        userId: 'me',
        requestBody: {
            raw: raw
        }
    })
}

//TODO: fix subject characters
function makeBody(to, from, subject, message) {
    const str = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
        "MIME-Version: 1.0\n",
        "Content-Transfer-Encoding: 7bit\n",
        "to: ", to, "\n",
        "from: ", from, "\n",
        "subject: ", subject, "\n\n",
        message
    ].join('');

    const encodedMail = Buffer.from(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
    return encodedMail;
}

