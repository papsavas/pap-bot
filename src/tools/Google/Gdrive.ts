import { google } from 'googleapis';
import { googleCredentials, googleToken } from '../../Entities/Generic/secrets';
import { Gauth } from './Gauth';
require('dotenv').config({ path: require('find-config')('.env') })


const SCOPES = ['https://www.googleapis.com/auth/drive.metadata'];

const credentials: googleCredentials = {
    installed: {
        "client_id": process.env.GDRIVE_CLIENT_ID,
        "project_id": process.env.GDRIVE_PROJECT_ID,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": process.env.GDRIVE_CLIENT_SECRET,
        "redirect_uris": [
            "urn:ietf:wg:oauth:2.0:oob",
            "http://localhost"
        ]
    }
};

const token: googleToken = {
    "access_token": process.env.GDRIVE_ACCESS_TOKEN,
    "refresh_token": process.env.GDRIVE_REFRESH_TOKEN,
    "scope": "https://www.googleapis.com/auth/drive",
    "token_type": "Bearer",
    "expiry_date": 1590000084528
};
const authPromise = Gauth(credentials, token, SCOPES);
const drive = google.drive({ version: "v3" });

export async function addDrivePermission(email: string) {
    return drive.permissions.create({
        auth: await authPromise,
        fileId: process.env.GDRIVE_FILE_ID,
        sendNotificationEmail: false,
        supportsAllDrives: true,
        fields: 'id',
        requestBody: {
            type: "user",
            role: "reader",
            emailAddress: email,

        }
    })
}

export async function deleteDrivePermission(perm_id: string) {
    return drive.permissions.delete({
        auth: await authPromise,
        fileId: process.env.GDRIVE_FILE_ID,
        permissionId: perm_id
    })
}