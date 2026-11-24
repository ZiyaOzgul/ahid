import { NextResponse } from "next/server";
import {
  requireAdmin,
  signUnsubscribeToken,
  verifyUnsubscribeToken,
} from "@/lib/auth";
import { parsePositiveId, SITE_BASE_URL } from "@/lib/constants";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendTransactionalEmail } from "@/lib/mailer";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const { data, error } = await supabaseServer
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`newsletter:${ip}`, 6, 60 * 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Çok fazla bülten isteği. Lütfen ${limit.resetInSeconds} saniye sonra tekrar deneyin.`,
        },
        { status: 429 }
      );
    }

    const body = (await request.json()) as { email?: string };
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Lütfen geçerli bir e-posta adresi girin." },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from("newsletter_subscribers")
      .upsert({ email }, { onConflict: "email" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const token = await signUnsubscribeToken(email);
    const unsubscribeUrl = `${SITE_BASE_URL}/bulten-iptal?token=${encodeURIComponent(
      token
    )}`;

    await sendTransactionalEmail({
      to: email,
      subject: "AHİD Kurumsal Bülten Aboneliğiniz Onaylandı",
      text: `Merhaba,\n\nAnkara Halkla İlişkiler Derneği kurumsal bültenine kaydınız alınmıştır.\n\nAbonelikten istediğiniz zaman ayrılmak için şu bağlantıyı kullanabilirsiniz:\n${unsubscribeUrl}\n\nSaygılarımızla,\nAHİD`,
    });

    return NextResponse.json({
      success: true,
      message: "Kurumsal bültene aboneliğiniz başarıyla tamamlandı.",
      unsubscribeUrl,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Geçersiz istek." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const id = searchParams.get("id");

  if (token) {
    const verifiedEmail = await verifyUnsubscribeToken(token);
    if (!verifiedEmail) {
      return NextResponse.json(
        { error: "Abonelik iptal bağlantısı geçersiz veya süresi dolmuş." },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from("newsletter_subscribers")
      .delete()
      .eq("email", verifiedEmail);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      email: verifiedEmail,
      message: `${verifiedEmail} adresi bülten listesinden çıkarıldı.`,
    });
  }

  // Otherwise require Admin to remove subscriber manually
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const numericId = parsePositiveId(id);
  if (!numericId) {
    return NextResponse.json(
      { error: "İptal tokenı veya geçerli abone ID gereklidir." },
      { status: 400 }
    );
  }

  const { error } = await supabaseServer
    .from("newsletter_subscribers")
    .delete()
    .eq("id", numericId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
