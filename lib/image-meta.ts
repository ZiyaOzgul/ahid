export interface ParsedUploadInfo {
  valid: boolean;
  error?: string;
  detectedType: "PNG" | "JPG" | "WEBP" | "GIF" | "PDF" | "UNKNOWN";
  mimeType: string;
  extension: string;
  width?: number;
  height?: number;
  dimensionsLabel: string;
  aspectRatioLabel: string;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function computeAspectRatio(w?: number, h?: number): string {
  if (!w || !h || w <= 0 || h <= 0) return "Belirtilmemiş";
  const divisor = gcd(w, h);
  const rw = w / divisor;
  const rh = h / divisor;
  if (rw > 40 || rh > 40) {
    const approx = Number((w / h).toFixed(2));
    return `${approx}:1`;
  }
  return `${rw}:${rh}`;
}

function parsePngDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24) return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (!width || !height) return null;
  return { width, height };
}

function parseGifDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 10) return null;
  const width = buf.readUInt16LE(6);
  const height = buf.readUInt16LE(8);
  if (!width || !height) return null;
  return { width, height };
}

function parseJpegDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4) return null;
  let offset = 2;
  while (offset + 4 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buf[offset + 1];
    // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15
    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isSof && offset + 8 < buf.length) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      if (width > 0 && height > 0) return { width, height };
      return null;
    }
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01) {
      offset += 2;
      continue;
    }
    if (offset + 3 >= buf.length) break;
    const segLen = buf.readUInt16BE(offset + 2);
    if (segLen < 2) break;
    offset += 2 + segLen;
  }
  return null;
}

function parseWebpDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 30) return null;
  const chunkHeader = buf.toString("ascii", 12, 16);
  if (chunkHeader === "VP8 " && buf.length >= 30) {
    const width = buf.readUInt16LE(26) & 0x3fff;
    const height = buf.readUInt16LE(28) & 0x3fff;
    return width && height ? { width, height } : null;
  }
  if (chunkHeader === "VP8L" && buf.length >= 25) {
    const b1 = buf[21];
    const b2 = buf[22];
    const b3 = buf[23];
    const b4 = buf[24];
    const width = 1 + (((b2 & 0x3f) << 8) | b1);
    const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
    return width && height ? { width, height } : null;
  }
  if (chunkHeader === "VP8X" && buf.length >= 30) {
    const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    return width && height ? { width, height } : null;
  }
  return null;
}

export function inspectUploadBuffer(
  buf: Buffer,
  options: { allowPdf: boolean }
): ParsedUploadInfo {
  // Check PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    const dims = parsePngDimensions(buf);
    return {
      valid: true,
      detectedType: "PNG",
      mimeType: "image/png",
      extension: "png",
      width: dims?.width,
      height: dims?.height,
      dimensionsLabel: dims ? `${dims.width} × ${dims.height}` : "Görsel (PNG)",
      aspectRatioLabel: computeAspectRatio(dims?.width, dims?.height),
    };
  }

  // Check JPEG: FF D8 FF
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    const dims = parseJpegDimensions(buf);
    return {
      valid: true,
      detectedType: "JPG",
      mimeType: "image/jpeg",
      extension: "jpg",
      width: dims?.width,
      height: dims?.height,
      dimensionsLabel: dims ? `${dims.width} × ${dims.height}` : "Görsel (JPG)",
      aspectRatioLabel: computeAspectRatio(dims?.width, dims?.height),
    };
  }

  // Check GIF: GIF87a / GIF89a
  if (buf.length >= 6 && buf.toString("ascii", 0, 3) === "GIF") {
    const dims = parseGifDimensions(buf);
    return {
      valid: true,
      detectedType: "GIF",
      mimeType: "image/gif",
      extension: "gif",
      width: dims?.width,
      height: dims?.height,
      dimensionsLabel: dims ? `${dims.width} × ${dims.height}` : "Görsel (GIF)",
      aspectRatioLabel: computeAspectRatio(dims?.width, dims?.height),
    };
  }

  // Check WEBP: RIFF....WEBP
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    const dims = parseWebpDimensions(buf);
    return {
      valid: true,
      detectedType: "WEBP",
      mimeType: "image/webp",
      extension: "webp",
      width: dims?.width,
      height: dims?.height,
      dimensionsLabel: dims ? `${dims.width} × ${dims.height}` : "Görsel (WEBP)",
      aspectRatioLabel: computeAspectRatio(dims?.width, dims?.height),
    };
  }

  // Check PDF: %PDF-
  if (buf.length >= 5 && buf.toString("ascii", 0, 5) === "%PDF-") {
    if (!options.allowPdf) {
      return {
        valid: false,
        error: "Bu uç noktaya yalnızca görsel dosyaları (PNG, JPG, WEBP, GIF) yüklenebilir.",
        detectedType: "PDF",
        mimeType: "application/pdf",
        extension: "pdf",
        dimensionsLabel: "A4 / Döküman",
        aspectRatioLabel: "PDF",
      };
    }
    return {
      valid: true,
      detectedType: "PDF",
      mimeType: "application/pdf",
      extension: "pdf",
      dimensionsLabel: "Döküman (PDF)",
      aspectRatioLabel: "A4",
    };
  }

  return {
    valid: false,
    error:
      "Desteklenmeyen veya bozuk dosya imzası. Güvenlik nedeniyle SVG ve bilinmeyen dosya biçimleri kabul edilmez.",
    detectedType: "UNKNOWN",
    mimeType: "application/octet-stream",
    extension: "bin",
    dimensionsLabel: "Bilinmiyor",
    aspectRatioLabel: "Bilinmiyor",
  };
}
