require('coffee-register');
const fs = require('fs');
const readline = require('readline');
//const { google } = require('googleapis');
import { google } from 'googleapis';
import { authorization } from './Gauth';


const SCOPES = [
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.send'
];
const TOKEN_PATH = '../tokens/token_gmail.json';

const CREDENTIALS_PATH = '../credentials/credentials_gmail.json';

//__________________________________________________________________________

function send(exauth, data) {
    var raw = makeBody(data.to, 'name of sender bluh bluh', data.subj, data.msg);
    const gmail = google.gmail({
        version: "v1"
        //, auth: exauth
    });
    //return gmail.users.messages.send({ auth: exauth, userId: 'me', resource: { raw } })
    return gmail.users.messages.send({
        auth: exauth,
        userId: 'me',
        requestBody: {
            raw: raw
        }
    })
}


export async function sendEmail(email_addr: string, subject: string, message: string) {
    const to = email_addr;
    const subj = subject;
    const msg = message;

    let exauth = await authorization(SCOPES, TOKEN_PATH, CREDENTIALS_PATH);
    return send(exauth, { to, subj, msg });

}

function makeBody(to, from, subject, message) {
    var str = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
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

