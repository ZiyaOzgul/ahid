import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { signCaptchaChallenge } from "@/lib/auth";
import { getSystemSettings } from "@/lib/system-settings";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateCode(length = 5): string {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

function buildCaptchaSvg(code: string): string {
  const width = 168;
  const height = 52;
  const lines = Array.from({ length: 4 }, (_, i) => {
    const x1 = crypto.randomInt(0, 40);
    const y1 = crypto.randomInt(6, height - 6);
    const x2 = crypto.randomInt(width - 40, width);
    const y2 = crypto.randomInt(6, height - 6);
    const color = i % 2 === 0 ? "#cbd5e1" : "#94a3b8";
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.3" stroke-dasharray="3 2" />`;
  }).join("");

  const chars = code
    .split("")
    .map((ch, idx) => {
      const x = 22 + idx * 27;
      const y = 35 + crypto.randomInt(-4, 5);
      const rot = crypto.randomInt(-14, 15);
      const fill = idx % 2 === 0 ? "#0f1c2e" : "#1e3a5f";
      return `<text x="${x}" y="${y}" fill="${fill}" font-family="monospace, sans-serif" font-size="24" font-weight="800" transform="rotate(${rot} ${x} ${y})">${ch}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" rx="8" fill="#f1f5f9"/>${lines}${chars}</svg>`;
}

export async function GET() {
  try {
    const settings = await getSystemSettings();
    const code = generateCode(5);
    const token = await signCaptchaChallenge(code, 300);
    const svg = buildCaptchaSvg(code);
    const image = `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString(
      "base64"
    )}`;

    return NextResponse.json({
      required: settings.require_captcha,
      token,
      image,
      expiresInSeconds: 300,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Doğrulama kodu oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
