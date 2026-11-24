export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  sent: boolean;
  provider: "resend" | "mailto";
  id?: string;
  mailtoUrl: string;
  message: string;
}

export function buildMailtoUrl(to: string, subject: string, body: string): string {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  return `mailto:${encodeURIComponent(to)}?${params.toString()}`;
}

export function hasEmailProvider(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendTransactionalEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  const mailtoUrl = buildMailtoUrl(input.to, input.subject, input.text);
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM || "AHID Kurumsal <bildirim@ahid.org.tr>";

  if (!apiKey) {
    return {
      sent: false,
      provider: "mailto",
      mailtoUrl,
      message:
        "E-posta gönderim servisi (RESEND_API_KEY) yapılandırılmadığı için e-posta otomatik gönderilemedi; yerel e-posta istemcisi bağlantısı hazırlandı.",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
        reply_to: input.replyTo,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Bilinmeyen hata");
      return {
        sent: false,
        provider: "mailto",
        mailtoUrl,
        message: `E-posta sağlayıcısı yanıt hatası (${res.status}): ${errText}. E-posta istemcisi bağlantısı hazırlandı.`,
      };
    }

    const data = (await res.json()) as { id?: string };
    return {
      sent: true,
      provider: "resend",
      id: data.id,
      mailtoUrl,
      message: "E-posta Resend üzerinden başarıyla gönderildi.",
    };
  } catch {
    return {
      sent: false,
      provider: "mailto",
      mailtoUrl,
      message:
        "E-posta servisine ulaşılamadı; yerel e-posta istemcisi bağlantısı hazırlandı.",
    };
  }
}
