import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CONFIG_FILE = path.resolve('backup_config.json');

/**
 * Ler configuração salva pelo usuário no Painel Admin ou .env
 */
export const getBackupConfig = () => {
  let saved = {};
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch (e) {}
  
  return {
    targetEmail: saved.targetEmail || process.env.GOOGLE_DRIVE_CLIENT_EMAIL || '',
    folderId: saved.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID || '',
    privateKey: saved.privateKey || process.env.GOOGLE_DRIVE_PRIVATE_KEY || '',
    syncPath: saved.syncPath || process.env.GOOGLE_DRIVE_SYNC_PATH || ''
  };
};

/**
 * Salvar nova configuração informada no Painel Admin
 */
export const saveBackupConfig = (newConfig) => {
  const current = getBackupConfig();
  const updated = { ...current, ...newConfig };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
};

/**
 * Helper para autenticação JWT da Service Account (se utilizada)
 */
async function getGoogleDriveAccessToken(clientEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const base64UrlEncode = (str) =>
    Buffer.from(typeof str === 'string' ? str : JSON.stringify(str))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(claimSet)}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  const formattedKey = privateKey.replace(/\\n/g, '\n');
  const signature = signer.sign(formattedKey, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${unsignedToken}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Erro ao autenticar no Google Cloud');
  }
  return data.access_token;
}

/**
 * Copia o backup .ZIP para o endereço/pasta ou envia via API do Google Drive
 */
export const uploadToGoogleDrive = async (backupFilePath, filename) => {
  try {
    const config = getBackupConfig();
    const syncDir = config.syncPath || process.env.GOOGLE_DRIVE_SYNC_PATH;
    const clientEmail = config.targetEmail || process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
    const privateKey = config.privateKey || process.env.GOOGLE_DRIVE_PRIVATE_KEY;
    const folderId = config.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

    // MÉTODO 1: API do Google Cloud (Service Account) - Recomendado para VPS
    if (clientEmail && privateKey && folderId) {
      console.log(`☁️ [Google Drive API] Autenticando com Service Account (${clientEmail})...`);
      const accessToken = await getGoogleDriveAccessToken(clientEmail, privateKey);

      const fileBuffer = fs.readFileSync(backupFilePath);
      const metadata = {
        name: filename,
        parents: [folderId],
        mimeType: 'application/zip'
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartBody = Buffer.concat([
        Buffer.from(delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata)),
        Buffer.from(delimiter + 'Content-Type: application/zip\r\n\r\n'),
        fileBuffer,
        Buffer.from(closeDelimiter)
      ]);

      const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': multipartBody.length.toString()
        },
        body: multipartBody
      });

      const uploadData = await uploadRes.json();
      if (uploadRes.ok) {
        console.log(`☁️ [Google Drive API] Backup enviado com sucesso! File ID no Google Drive: ${uploadData.id}`);
        return { success: true, method: 'GOOGLE_DRIVE_API', fileId: uploadData.id };
      } else {
        console.error('❌ Erro no upload via Google Drive API:', uploadData);
      }
    }

    // MÉTODO 2: Envio para a pasta local sincronizada do computador
    if (syncDir) {
      const resolvedPath = path.resolve(syncDir);
      if (!fs.existsSync(resolvedPath)) {
        fs.mkdirSync(resolvedPath, { recursive: true });
      }
      const destPath = path.join(resolvedPath, filename);
      fs.copyFileSync(backupFilePath, destPath);
      console.log(`☁️ [Google Drive Sync] Backup .ZIP enviado para a pasta local: ${destPath}`);
      return { success: true, method: 'LOCAL_SYNC_PATH', destination: destPath, email: clientEmail };
    }

    console.log(`ℹ️ [Google Drive Sync] Backup salvo localmente em backups/${filename}. Configure as chaves ou pasta no Painel Admin.`);
    return { success: false, reason: 'NO_CONFIG' };

  } catch (error) {
    console.error('❌ Erro ao sincronizar com o Google Drive:', error.message);
    return { success: false, error: error.message };
  }
};
