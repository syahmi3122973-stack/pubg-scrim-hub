/**
 * ScrimHub OCR Poster Archiver (Google Apps Script Web App)
 *
 * Deploy once while signed in as: syahmi3122973@gmail.com
 *
 * Folder structure created automatically in Google Drive:
 *   ScrimHub OCR Posters / <Nama User Upload> / <Tarikh & Masa Upload MYT> / <Nama Fail>
 *
 * Setup steps:
 *   1. Open https://script.google.com (logged in as syahmi3122973@gmail.com)
 *   2. New Project -> paste this code -> replace SHARED_SECRET below
 *   3. Click Deploy -> New deployment -> Web app
 *      - Execute as: Me (syahmi3122973@gmail.com)
 *      - Who has access: Anyone
 *   4. Authorize Drive access -> copy the Web App URL (https://script.google.com/macros/s/.../exec)
 *   5. Save both URL & secret into Supabase Edge Function Secrets:
 *      GDRIVE_WEBHOOK_URL="https://script.google.com/macros/s/.../exec"
 *      GDRIVE_WEBHOOK_SECRET="<same SHARED_SECRET>"
 */

const ROOT_FOLDER_NAME = 'ScrimHub OCR Posters';
const SHARED_SECRET = 'REPLACE_WITH_YOUR_SECRET_TOKEN';

function sanitizeSegment(raw, fallback) {
  const cleaned = String(raw || '')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  return cleaned || fallback;
}

function getOrCreateFolder(parent, name) {
  const iter = parent.getFoldersByName(name);
  if (iter.hasNext()) {
    return iter.next();
  }
  return parent.createFolder(name);
}

function doPost(e) {
  try {
    const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const payload = JSON.parse(rawBody);

    if (!SHARED_SECRET || SHARED_SECRET === 'REPLACE_WITH_YOUR_SECRET_TOKEN' || payload.secret !== SHARED_SECRET) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: false, error: 'Unauthorized' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const base64Data = String(payload.imageBase64 || '').trim();
    const mimeType = String(payload.mimeType || 'image/jpeg').trim();
    if (!base64Data) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: false, error: 'Missing imageBase64' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const uploaderFolderName = sanitizeSegment(payload.uploaderName, 'Guest');
    const timestampFolderName = sanitizeSegment(
      payload.uploadedAtMyt,
      Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'yyyy-MM-dd HH-mm-ss') + ' MYT'
    );
    const ext = mimeType.indexOf('png') !== -1 ? 'png' : mimeType.indexOf('webp') !== -1 ? 'webp' : 'jpg';
    const fileName = sanitizeSegment(payload.fileName, 'poster_' + Date.now() + '.' + ext);

    const rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), ROOT_FOLDER_NAME);
    const userFolder = getOrCreateFolder(rootFolder, uploaderFolderName);
    const timeFolder = getOrCreateFolder(userFolder, timestampFolderName);

    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);
    const savedFile = timeFolder.createFile(blob);
    savedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const fileId = savedFile.getId();

    return ContentService.createTextOutput(
      JSON.stringify({
        ok: true,
        fileId: fileId,
        downloadUrl: 'https://drive.google.com/uc?export=download&id=' + fileId,
        viewUrl: savedFile.getUrl(),
        folderPath: ROOT_FOLDER_NAME + '/' + uploaderFolderName + '/' + timestampFolderName + '/' + fileName,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
