import QRCode from "qrcode";

export async function generateQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 220,
    color: {
      dark: "#0f1c2e",
      light: "#ffffff",
    },
  });
}

export async function generateQrSvg(payload: string): Promise<string> {
  return QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 220,
    color: {
      dark: "#0f1c2e",
      light: "#ffffff",
    },
  });
}
