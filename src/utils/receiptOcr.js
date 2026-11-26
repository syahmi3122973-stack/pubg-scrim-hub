import { createWorker } from 'tesseract.js';

/**
 * Normalizes an OCR reference string to uppercase alphanumeric characters for matching.
 */
export function normalizeOcrRef(raw) {
  return String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * Pure parser for DuitNow / Malaysian banking receipt text.
 * Extracts payment amount (RM / MYR / labeled total) and reference number.
 */
export function parseReceiptText(rawText) {
  const text = String(rawText || '').replace(/\r/g, '\n');
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let ocrExtractedAmount = null;
  const currencyCandidates = [];

  const labeledAmountRegex =
    /(?:amount|jumlah|total|paid|payment|bayaran|rm|myr)\s*[:=\-]?\s*(?:rm|myr)?\s*([0-9]{1,5}(?:,[0-9]{3})*\.[0-9]{2})/i;
  const plainRmRegex = /(?:RM|MYR)\s*([0-9]{1,5}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/gi;

  for (const line of lines) {
    const labeledMatch = line.match(labeledAmountRegex);
    if (labeledMatch?.[1]) {
      const val = Number.parseFloat(labeledMatch[1].replace(/,/g, ''));
      if (Number.isFinite(val) && val > 0 && val <= 50000) {
        currencyCandidates.push({ val, priority: /total|amount|jumlah|paid|bayaran/i.test(line) ? 2 : 1 });
      }
    }
    let m;
    while ((m = plainRmRegex.exec(line)) !== null) {
      const val = Number.parseFloat(m[1].replace(/,/g, ''));
      if (Number.isFinite(val) && val > 0 && val <= 50000) {
        currencyCandidates.push({ val, priority: 1 });
      }
    }
  }

  if (currencyCandidates.length > 0) {
    currencyCandidates.sort((a, b) => b.priority - a.priority || b.val - a.val);
    ocrExtractedAmount = Number(currencyCandidates[0].val.toFixed(2));
  }

  let ocrReferenceNo = null;
  const refLabelRegex =
    /(?:reference(?:\s*(?:no|num|number|id))?|ref(?:\s*(?:no|num|number|id))?|transaction(?:\s*(?:id|no|ref))?|duitnow\s+(?:ref(?:erence)?|id|no)|rujukan(?:\s*no)?)\s*[:#=\-]?\s*([A-Z0-9][A-Z0-9\-]{5,32})/i;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const directMatch = line.match(refLabelRegex);
    const directNorm = directMatch?.[1] ? normalizeOcrRef(directMatch[1]) : '';
    if (directNorm.length >= 6 && /\d/.test(directNorm)) {
      ocrReferenceNo = directMatch[1].toUpperCase();
      break;
    }
    // Some receipts put "Reference Number" on one line and the code on the next line
    if (
      /^(?:reference(?:\s*(?:no|num|number|id))?|ref(?:\s*(?:no|id))?|transaction\s*(?:id|no)|duitnow\s+(?:ref|id|no)|rujukan(?:\s*no)?)$/i.test(line) &&
      lines[i + 1]
    ) {
      const nextToken = lines[i + 1].split(/\s+/)[0]?.replace(/[^A-Za-z0-9\-]/g, '');
      const nextNorm = normalizeOcrRef(nextToken);
      if (nextNorm.length >= 6 && /\d/.test(nextNorm)) {
        ocrReferenceNo = nextToken.toUpperCase();
        break;
      }
    }
  }

  if (!ocrReferenceNo) {
    const fallbackRefMatch =
      text.match(/\b(20[2-9][0-9][01][0-9][0-3][0-9][A-Z0-9]{6,22})\b/i) ||
      text.match(/\b([A-Z]{2,6}[0-9]{8,20})\b/) ||
      text.match(/\b([0-9]{12,24})\b/);
    if (fallbackRefMatch?.[1]) {
      ocrReferenceNo = fallbackRefMatch[1].toUpperCase();
    }
  }

  return {
    ocrExtractedAmount,
    ocrReferenceNo
  };
}

/**
 * Runs client-side Tesseract.js OCR on a receipt File/Blob/URL.
 */
export async function scanReceiptImage(imageSource, onProgress) {
  let worker = null;
  try {
    worker = await createWorker('eng', 1, {
      logger: (msg) => {
        if (typeof onProgress === 'function' && msg?.status === 'recognizing text') {
          onProgress(Math.round((msg.progress || 0) * 100));
        }
      }
    });
    const {
      data: { text = '' }
    } = await worker.recognize(imageSource);
    const parsed = parseReceiptText(text);
    return {
      rawText: text,
      ...parsed
    };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // Ignore worker termination errors on cleanup
      }
    }
  }
}
