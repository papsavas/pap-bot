require('coffee-register');
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const gapi = require('gapi');
const { Console } = require('console');
const { EOF } = require('dns');
const { auth } = require('googleapis/build/src/apis/alertcenter');
const { connect } = require('http2');




/* autorization(): log in to Google. Returns a promise with the oAuth2Client */

export async function authorization(scopes, token_path, credential_path) {
    // If modifying these scopes, delete token.json.
    const SCOPES = scopes;
    // The file token.json stores the user's access and refresh tokens, and is
    // created automatically when the authorization flow completes for the first
    // time.
    const TOKEN_PATH = token_path;

    const loadCredentials = new Promise((resolve, reject) => {
        resolve(require(credential_path));
    })
    // Load client secrets from a local file.
    let content = await loadCredentials;

    let retauth = await authorize(content);
    return new Promise((resolve, reject) => {
        resolve(retauth);
    });


    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    async function authorize(credentials) {
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.

        const loadToken = new Promise((resolve, reject) => {
            resolve(require(TOKEN_PATH));
        })
        // Load client secrets from a local file.
        let token = await loadToken;
        oAuth2Client.setCredentials(token);
        /*
         fs.readFile(TOKEN_PATH, (err, token) => {
             if (err) return getAccessToken(oAuth2Client);
             oAuth2Client.setCredentials(JSON.parse(token));
             //console.log(oAuth2Client);
             
             //callback(oAuth2Client);
         });
         */
        return oAuth2Client;
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} callback The callback for the authorized client.
     */
    function getAccessToken(oAuth2Client) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        console.log('Authorize this app by visiting this url:', authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) return console.error('Error retrieving access token', err);
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) return console.error(err);
                    console.log('Token stored to', TOKEN_PATH);
                });
                //callback(oAuth2Client);
            });
        });
    }

    /**
     * Lists the next 10 events on the user's primary calendar.
     * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
     */

}