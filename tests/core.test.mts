import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.AUTH_SECRET =
  "test-secret-for-ahid-unit-suite-64-chars-minimum-value-1234567890";

import {
  generateTemporaryPassword,
  hashPassword,
  isHashedPassword,
  verifyPassword,
} from "../lib/password.ts";
import {
  signCaptchaChallenge,
  signSessionToken,
  signUnsubscribeToken,
  verifyCaptchaChallenge,
  verifySessionToken,
  verifyUnsubscribeToken,
} from "../lib/tokens.ts";
import {
  escapeLikePattern,
  normalizeBoardCategory,
  parseApplicationMeta,
  parsePositiveId,
  serializeApplicationMeta,
  slugifyTurkish,
} from "../lib/constants.ts";
import { inspectUploadBuffer } from "../lib/image-meta.ts";
import { generateQrDataUrl, generateQrSvg } from "../lib/qr.ts";

describe("AHİD Password Hashing & Verification", () => {
  it("hashes password with scrypt format and verifies it accurately", () => {
    const hash = hashPassword("AhidGuvenliSifre2026!");
    assert.equal(isHashedPassword(hash), true);
    assert.equal(verifyPassword("AhidGuvenliSifre2026!", hash).valid, true);
    assert.equal(verifyPassword("AhidGuvenliSifre2026!", hash).needsRehash, false);
    assert.equal(verifyPassword("YanlisSifre", hash).valid, false);
  });

  it("flags legacy plaintext passwords for immediate rehash", () => {
    const check = verifyPassword("eskiSifre123", "eskiSifre123");
    assert.equal(check.valid, true);
    assert.equal(check.needsRehash, true);
    assert.equal(isHashedPassword("eskiSifre123"), false);
  });

  it("generates temporary passwords of expected length", () => {
    const temp = generateTemporaryPassword(12);
    assert.equal(temp.length, 12);
  });
});

describe("AHİD Signed Session, CAPTCHA & Unsubscribe Tokens", () => {
  it("signs and verifies session tokens and rejects tampering or expiry", async () => {
    const token = await signSessionToken({
      id: 42,
      email: "uye@ahid.org.tr",
      role: "member",
      full_name: "Test Üye",
      member_no: "AHID-2026-1001",
    });
    const decoded = await verifySessionToken(token);
    assert.ok(decoded);
    assert.equal(decoded.id, 42);
    assert.equal(decoded.email, "uye@ahid.org.tr");
    assert.equal(decoded.role, "member");

    const tampered = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A");
    assert.equal(await verifySessionToken(tampered), null);

    const expired = await signSessionToken(
      { id: 1, email: "x@ahid.org.tr", role: "admin", full_name: "Admin" },
      -10
    );
    assert.equal(await verifySessionToken(expired), null);
  });

  it("verifies CAPTCHA challenges case-insensitively and rejects wrong codes", async () => {
    const challengeToken = await signCaptchaChallenge("K7P9M");
    assert.equal(await verifyCaptchaChallenge(challengeToken, "k7p9m"), true);
    assert.equal(await verifyCaptchaChallenge(challengeToken, "WRONG"), false);
  });

  it("signs and verifies newsletter unsubscribe tokens", async () => {
    const unsubToken = await signUnsubscribeToken("Okur@Example.ORG.TR");
    const email = await verifyUnsubscribeToken(unsubToken);
    assert.equal(email, "okur@example.org.tr");
    assert.equal(await verifyUnsubscribeToken("invalid.token"), null);
  });
});

describe("AHİD Domain Helpers & Sanitizers", () => {
  it("round-trips structured application metadata cleanly", () => {
    const packed = serializeApplicationMeta(
      {
        committees: ["Kamu Diplomasisi", "Genç İletişimciler"],
        references: ["Ayşe Yılmaz", "Mehmet Kaya"],
        approved_user_id: 19,
        approved_member_no: "AHID-2026-1900",
      },
      "Kurul ön incelemesi olumlu."
    );
    const parsed = parseApplicationMeta(packed);
    assert.deepEqual(parsed.meta.committees, [
      "Kamu Diplomasisi",
      "Genç İletişimciler",
    ]);
    assert.deepEqual(parsed.meta.references, ["Ayşe Yılmaz", "Mehmet Kaya"]);
    assert.equal(parsed.meta.approved_user_id, 19);
    assert.equal(parsed.meta.approved_member_no, "AHID-2026-1900");
    assert.equal(parsed.note, "Kurul ön incelemesi olumlu.");
  });

  it("slugifies Turkish characters and escapes LIKE wildcards", () => {
    assert.equal(
      slugifyTurkish("Çağdaş İletişim ve Şeffaf Yönetim Ödülü"),
      "cagdas-iletisim-ve-seffaf-yonetim-odulu"
    );
    assert.equal(escapeLikePattern("AHID_2026%\\test"), "AHID\\_2026\\%\\\\test");
    assert.equal(normalizeBoardCategory("danisma_kurulu"), "yuksek_danisma");
    assert.equal(parsePositiveId("105"), 105);
    assert.equal(parsePositiveId("-5"), null);
  });
});

describe("AHİD Magic-Byte Upload Inspection & QR Generation", () => {
  it("detects PNG dimensions, toggles PDF allowance, and rejects SVG uploads", () => {
    const pngHeader = Buffer.alloc(24);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(
      pngHeader,
      0
    );
    pngHeader.writeUInt32BE(1280, 16);
    pngHeader.writeUInt32BE(720, 20);

    const pngInfo = inspectUploadBuffer(pngHeader, { allowPdf: false });
    assert.equal(pngInfo.valid, true);
    assert.equal(pngInfo.detectedType, "PNG");
    assert.equal(pngInfo.width, 1280);
    assert.equal(pngInfo.height, 720);
    assert.equal(pngInfo.aspectRatioLabel, "16:9");

    const pdfBuf = Buffer.from("%PDF-1.7\n1 0 obj", "ascii");
    assert.equal(inspectUploadBuffer(pdfBuf, { allowPdf: true }).valid, true);
    assert.equal(inspectUploadBuffer(pdfBuf, { allowPdf: false }).valid, false);

    const svgBuf = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    assert.equal(inspectUploadBuffer(svgBuf, { allowPdf: true }).valid, false);
  });

  it("generates real QR PNG data URLs and SVG markup", async () => {
    const dataUrl = await generateQrDataUrl("https://www.ahid.org.tr/test");
    assert.ok(dataUrl.startsWith("data:image/png;base64,"));
    const svg = await generateQrSvg("https://www.ahid.org.tr/test");
    assert.ok(svg.includes("<svg"));
  });
});
