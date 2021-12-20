export { googleToken, googleCredentials };
interface googleToken {
    "access_token": string,
    "refresh_token": string,
    "scope": string,
    "token_type": string,
    "expiry_date": number
}

interface coreCredentials {
    "client_id": string,
    "project_id": string,
    "auth_uri": string,
    "token_uri": string,
    "auth_provider_x509_cert_url": string,
    "client_secret": string,
    "redirect_uris"?: [
        string,
        string,
    ]
}

interface googleCredentials {
    "installed"?: coreCredentials
    "web"?: coreCredentials
}


