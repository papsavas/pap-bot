import { google } from 'googleapis';
import { googleCredentials, googleToken } from '../../Entities/Generic/secrets';
import { Gauth } from './Gauth';

if (process.env.NODE_ENV !== 'production')
    (await import('dotenv'))
        .config({ path: (await import('find-config')).read('.env') })  //load env variables


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
const driveV3 = google.drive({ version: "v3" });
const driveV2 = google.drive({ version: "v2" });

export async function addDrivePermission(email: string/*, date?: Date*/) {
    /*v3 (expiration date buggy)*/
    return driveV3.permissions.create({
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

    /* return date ? driveV3.permissions.update({
         auth: await authPromise,
         fileId: process.env.GDRIVE_FILE_ID,
         permissionId: perm.data.id,
         fields: 'id',
         requestBody: {
             role: "reader",
             expirationTime: date.toISOString()
         }
     }) : perm
     */

    //----------------------------------------------------

    /*v2 (expiration date buggy)*/
    /* 
    
    const perm = await driveV2.permissions.insert({
        auth: await authPromise,
        fileId: process.env.GDRIVE_FILE_ID,
        sendNotificationEmails: false,
        supportsAllDrives: true,
        fields: '*',
        requestBody: {
            value: email,
            type: "user",
            role: "reader",
            emailAddress: email,

        }
    });

    return date ? driveV2.permissions.patch({
        auth: await authPromise,
        fileId: process.env.GDRIVE_FILE_ID,
        permissionId: perm.data.id,
        fields: '*',
        requestBody: {
            value: perm.data.emailAddress,
            role: "reader",
            expirationDate: date.toISOString()
        }
    }) : perm
    */
}

export async function deleteDrivePermission(perm_id: string) {
    return driveV3.permissions.delete({
        auth: await authPromise,
        fileId: process.env.GDRIVE_FILE_ID,
        permissionId: perm_id
    })
}