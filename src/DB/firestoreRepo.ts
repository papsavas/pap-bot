import { ServiceAccount } from "firebase-admin/lib/credential";

const firebase = await import("firebase/firestore");
const admin = await import('firebase-admin');
const FieldValue = admin.firestore.FieldValue;

if (process.env.NODE_ENV !== 'production')
    (await import('dotenv'))
        .config({ path: (await import('find-config')).read('.env') })  //load env variables

const serviceAccount: ServiceAccount =
{
    //"type": "service_account",
    "projectId": process.env.FS_PROJECT_ID.toString(),
    //"private_key_id": process.env.FS_PRIVATE_KEY_ID,
    "privateKey": process.env.FS_PRIVATE_KEY.toString(),//.replace(/\\n/g, '\n'),
    "clientEmail": process.env.FS_CLIENT_EMAIL.toString(),
    //"client_id": process.env.FS_CLIENT_ID,
    //"auth_uri": "https://accounts.google.com/o/oauth2/auth",
    //"token_uri": "https://oauth2.googleapis.com/token",
    //"auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    //"client_x509_cert_url": process.env.FS_CLIENT_X509_CERT_URL
}


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

export async function readData(docPath, field?) {
    const fetched_data = await db.doc(docPath).get();
    return field ? fetched_data.data()[field] : fetched_data.data();
}

export async function getCollection(colPath) {
    const snapshot = await db.collection(colPath).get()
    return snapshot.docs.map(doc => doc.data());
}

export async function setData(docPath, data) {
    const res = await db.doc(docPath).set(data);
    return new Promise((resolve, reject) => {
        resolve(JSON.stringify(res));
    });
}

export async function updateData(docPath, data) {
    const res = await db.doc(docPath).update(data);
    return new Promise((resolve, reject) => {
        resolve(JSON.stringify(res));
    });
}

export async function deleteField(col, doc, key) {
    let updates = {};
    updates[key] = FieldValue.delete();
    try {
        return db.collection(col).doc(doc).update(updates);
    } catch (error) {
        console.log(`error on deleting fields\n${error}`);
    }
}