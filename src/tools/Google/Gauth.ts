import fs from 'fs'
import { google } from 'googleapis'
import readline from 'readline'
import { googleCredentials, googleToken } from '../../Entities/Generic/secrets'

const TOKEN_PATH = './secrets/token.json'

export function Gauth(credentials: googleCredentials, token: googleToken, scopes: string[]) {
    return authorize(credentials, token, scopes);
}

async function authorize(cred: googleCredentials, token: googleToken, scopes: string[]) {
    const { client_secret, client_id, redirect_uris } = cred['installed'] ?? cred['web']
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0])

    if (Boolean(token)) {
        oAuth2Client.setCredentials(token)
        return oAuth2Client
    }
    else
        return getNewToken(oAuth2Client, scopes);
}

//TODO: handle undefined tokens
async function getNewToken<T = any>(oAuth2Client: any, SCOPES: string[]): Promise<T> {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    })

    console.log('Authorize this app by visiting this url:', authUrl)
    const code = await readlineAsync('Enter the code from that page here: ')
    const token = await new Promise((resolve, reject) => {
        oAuth2Client.getToken(code, (err: any, token: any) => {
            err ? reject(err) : resolve(token)
        })
    })
    oAuth2Client.setCredentials(token)
    // Store the token to disk for later program executions
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token))
    console.log('Token stored to', TOKEN_PATH)

    return oAuth2Client
}

async function readlineAsync(question: string) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close()
            resolve(answer)
        })
    })
}
