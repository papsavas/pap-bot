import { google, sheets_v4 } from "googleapis";
import { GaxiosResponse } from "googleapis-common";
import { googleCredentials, googleToken } from '../../Entities/Generic/secrets';
import { Gauth } from './Gauth';

export { fetchSheet };

if (process.env.NODE_ENV !== 'production')
    (await import('dotenv'))
        .config({ path: (await import('find-config')).read('.env') })  //load env variables


const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const credentials: googleCredentials = {
    installed: {
        client_id: process.env.GSHEETS_CLIENT_ID,
        client_secret: process.env.GSHEETS_CLIENT_SECRET,
        project_id: process.env.GSHEETS_PROJECT_ID,
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        redirect_uris: [
            "urn:ietf:wg:oauth:2.0:oob",
            "http://localhost"
        ]
    }
}

const token: googleToken = {
    access_token: process.env.GSHEETS_ACCESS_TOKEN,
    refresh_token: process.env.GSHEETS_REFRESH_TOKEN,
    scope: SCOPES[0],
    expiry_date: 1595695883192,
    token_type: "Bearer"
}

const authP = Gauth(credentials, token, ["https://www.googleapis.com/auth/spreadsheets"]);
export interface SheetResponse {
    values: GaxiosResponse<sheets_v4.Schema$ValueRange>,
    spreadsheet?: GaxiosResponse<sheets_v4.Schema$Spreadsheet>
}
async function fetchSheet(
    params: sheets_v4.Params$Resource$Spreadsheets$Values$Get,
    sheetParams?: sheets_v4.Params$Resource$Spreadsheets$Get)
    : Promise<SheetResponse> {
    const sheets = google.sheets({ version: 'v4', auth: await authP });
    const spreadsheet = sheetParams ? await sheets.spreadsheets.get(sheetParams) : undefined;
    const values = await sheets.spreadsheets.values.get(params)
    return { values, spreadsheet };
}