
declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

interface GoogleDriveConfig {
    clientId: string;
    apiKey: string;
}

let tokenClient: any;
let isGapiLoaded = false;
let isGisLoaded = false;

const loadGapi = (apiKey: string) => {
    return new Promise<void>((resolve, reject) => {
        if (window.gapi) {
            window.gapi.load('client', async () => {
                await window.gapi.client.init({
                    apiKey: apiKey,
                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                });
                isGapiLoaded = true;
                resolve();
            });
        } else {
            reject('GAPI script not loaded');
        }
    });
};

const loadGis = (clientId: string) => {
    return new Promise<void>((resolve, reject) => {
        if (window.google) {
            tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'https://www.googleapis.com/auth/drive.file',
                callback: '', // defined later
            });
            isGisLoaded = true;
            resolve();
        } else {
            reject('Google Identity Services script not loaded');
        }
    });
};

const ensureInitialized = async (config: GoogleDriveConfig) => {
    if (!config.clientId || !config.apiKey) {
        throw new Error('Google Client ID and API Key are required. Please configure them in Settings.');
    }
    if (!isGapiLoaded) await loadGapi(config.apiKey);
    if (!isGisLoaded) await loadGis(config.clientId);
};

export const uploadToGoogleDrive = async (
    title: string, 
    htmlContent: string, 
    config: GoogleDriveConfig
): Promise<string> => {
    await ensureInitialized(config);

    return new Promise((resolve, reject) => {
        tokenClient.callback = async (resp: any) => {
            if (resp.error) {
                reject(resp);
                return;
            }
            try {
                // Add styles to the HTML to ensure table borders and basic formatting
                const styledHtml = `
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; }
                            h1, h2, h3, h4, h5, h6 { color: #000; font-weight: bold; margin-top: 1em; margin-bottom: 0.5em; }
                            table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                            th, td { border: 1px solid #000; padding: 8px; text-align: left; vertical-align: top; }
                            th { background-color: #f2f2f2; }
                            img { max-width: 100%; height: auto; }
                            ul, ol { margin-left: 20px; }
                        </style>
                    </head>
                    <body>
                        <h1>${title}</h1>
                        ${htmlContent}
                    </body>
                    </html>
                `;

                // Upload to Drive
                // We use multipart upload to send metadata + content
                const metadata = {
                    name: title,
                    mimeType: 'application/vnd.google-apps.document', // Convert to Google Doc
                };

                const multipartRequestBody =
                    `--foo_bar_baz\r\n` +
                    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
                    `${JSON.stringify(metadata)}\r\n` +
                    `--foo_bar_baz\r\n` +
                    `Content-Type: text/html\r\n\r\n` +
                    `${styledHtml}\r\n` +
                    `--foo_bar_baz--`;

                const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resp.access_token}`,
                        'Content-Type': 'multipart/related; boundary=foo_bar_baz',
                    },
                    body: multipartRequestBody
                });

                if (!response.ok) {
                    throw new Error(`Upload failed: ${response.statusText}`);
                }

                const result = await response.json();
                resolve(`https://docs.google.com/document/d/${result.id}/edit`);

            } catch (error) {
                reject(error);
            }
        };

        // Trigger OAuth flow
        if (window.gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    });
};

export const googleDriveService = {
    uploadToGoogleDrive
};
