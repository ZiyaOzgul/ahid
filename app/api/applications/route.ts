import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  MEMBERSHIP_TIERS,
  parseApplicationMeta,
  parsePositiveId,
  serializeApplicationMeta,
} from "@/lib/constants";
import { generateTemporaryPassword, hashPassword } from "@/lib/password";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getSystemSettings } from "@/lib/system-settings";
import { sendTransactionalEmail } from "@/lib/mailer";
import { recordAuditLog } from "@/lib/audit";
import { supabaseServer } from "@/lib/supabase-server";

function resolveTierAmount(tier?: string | null): {
  label: string;
  amount: number;
} {
  const normalized = (tier || "").toLowerCase();
  if (normalized.includes("onursal") || normalized.includes("kurumsal")) {
    return { label: "Kurumsal / Onursal Üye", amount: 8500 };
  }
  if (normalized.includes("genc") || normalized.includes("genç") || normalized.includes("aday")) {
    return { label: "Genç Profesyonel / Aday", amount: 600 };
  }
  const asli = MEMBERSHIP_TIERS[0];
  return { label: asli.title, amount: asli.annualAmount };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabaseServer
    .from("membership_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const enriched = (data || []).map((row) => {
    const parsed = parseApplicationMeta(row.admin_notes);
    return {
      ...row,
      committees: parsed.meta.committees,
      references: parsed.meta.references,
      approved_member_no: parsed.meta.approved_member_no || null,
      approved_user_id: parsed.meta.approved_user_id || row.user_id || null,
      admin_notes: parsed.note,
    };
  });

  return NextResponse.json({
    success: true,
    applications: enriched,
    data: enriched,
  });
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`app:${ip}`, 5, 60 * 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Çok fazla başvuru gönderildi. Lütfen ${limit.resetInSeconds} saniye sonra tekrar deneyin.`,
        },
        { status: 429 }
      );
    }

    const settings = await getSystemSettings();
    if (!settings.membership_open) {
      return NextResponse.json(
        {
          error:
            "Yeni üyelik başvuruları yönetim kararıyla geçici olarak durdurulmuştur.",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      tier?: string;
      first_name?: string;
      last_name?: string;
      tc_no?: string;
      email?: string;
      phone?: string;
      birth_date?: string | null;
      city?: string | null;
      organization?: string | null;
      position?: string | null;
      university?: string | null;
      graduation_year?: string | null;
      degree?: string | null;
      experience_years?: string | null;
      linkedin_url?: string | null;
      cv_url?: string | null;
      committees?: string[];
      references?: string[];
    };

    const firstName = (body.first_name || "").trim();
    const lastName = (body.last_name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const phone = (body.phone || "").trim();
    const tcNo = (body.tc_no || "").trim();

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: "Ad, soyad, e-posta ve telefon bilgileri zorunludur." },
        { status: 400 }
      );
    }

    if (tcNo && !/^\d{11}$/.test(tcNo)) {
      return NextResponse.json(
        { error: "T.C. Kimlik Numarası 11 haneli rakamlardan oluşmalıdır." },
        { status: 400 }
      );
    }

    const appNo = `BAS-${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const committees = Array.isArray(body.committees)
      ? body.committees.filter((v) => typeof v === "string" && v.trim())
      : [];
    const references = Array.isArray(body.references)
      ? body.references.filter((v) => typeof v === "string" && v.trim())
      : [];

    const packedNotes = serializeApplicationMeta(
      { committees, references },
      ""
    );

    const { data, error } = await supabaseServer
      .from("membership_applications")
      .insert({
        application_no: appNo,
        tier: body.tier || "asli",
        first_name: firstName,
        last_name: lastName,
        tc_no: tcNo || "00000000000",
        email,
        phone,
        birth_date: body.birth_date || null,
        city: body.city || null,
        organization: body.organization || null,
        position: body.position || null,
        university: body.university || null,
        graduation_year: body.graduation_year || null,
        degree: body.degree || null,
        experience_years: body.experience_years || null,
        linkedin_url: body.linkedin_url || null,
        cv_url: body.cv_url || null,
        admin_notes: packedNotes,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await sendTransactionalEmail({
      to: email,
      subject: `AHİD Üyelik Başvurunuz Alındı (${appNo})`,
      text: `Sayın ${firstName} ${lastName},\n\nAnkara Halkla İlişkiler Derneği üyelik başvurunuz ${appNo} takip numarası ile alınmıştır. Yönetim Kurulu incelemesinin ardından tarafınıza bilgi verilecektir.\n\nSaygılarımızla,\nAHİD Genel Sekreterliği`,
    });

    const createdItem = {
      ...data,
      committees,
      references,
      admin_notes: "",
    };

    return NextResponse.json(
      {
        success: true,
        application: createdItem,
        data: createdItem,
        application_no: appNo,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Geçersiz başvuru verisi." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as {
      id?: number | string;
      status?: "pending" | "approved" | "rejected";
      admin_notes?: string;
    };

    const appId = parsePositiveId(body.id);
    if (!appId) {
      return NextResponse.json(
        { error: "Geçerli bir başvuru ID zorunludur." },
        { status: 400 }
      );
    }

    const { data: existing, error: fetchError } = await supabaseServer
      .from("membership_applications")
      .select("*")
      .eq("id", appId)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Başvuru kaydı bulunamadı." },
        { status: 404 }
      );
    }

    const parsed = parseApplicationMeta(existing.admin_notes);
    const nextMeta = { ...parsed.meta };
    const nextVisibleNote =
      body.admin_notes !== undefined ? body.admin_notes : parsed.note;

    let linkedUserId: number | null = existing.user_id;
    let provisionedAccount: {
      created: boolean;
      email: string;
      member_no: string;
      temporary_password?: string;
      email_sent: boolean;
      email_message: string;
    } | null = null;

    if (body.status === "approved") {
      const fullName = `${existing.first_name} ${existing.last_name}`.trim();
      const { label: tierLabel, amount: tierAmount } = resolveTierAmount(
        existing.tier
      );
      const normalizedEmail = existing.email.trim().toLowerCase();

      const { data: existingUser } = await supabaseServer
        .from("users")
        .select("id, email, member_no")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (existingUser) {
        linkedUserId = existingUser.id;
        const memberNo =
          existingUser.member_no ||
          `AHID-${new Date().getFullYear()}-${Math.floor(
            1000 + Math.random() * 9000
          )}`;
        if (!existingUser.member_no) {
          await supabaseServer
            .from("users")
            .update({ member_no: memberNo })
            .eq("id", existingUser.id);
        }
        nextMeta.approved_user_id = existingUser.id;
        nextMeta.approved_member_no = memberNo;
        nextMeta.reviewed_at = new Date().toISOString();

        provisionedAccount = {
          created: false,
          email: existingUser.email,
          member_no: memberNo,
          email_sent: false,
          email_message: "Kullanıcı hesabı zaten mevcut olduğu için mevcut hesap bağlandı.",
        };
      } else {
        const memberNo = `AHID-${new Date().getFullYear()}-${Math.floor(
          1000 + Math.random() * 9000
        )}`;
        const tempPassword = generateTemporaryPassword(12);
        const passwordHash = hashPassword(tempPassword);

        const { data: createdUser, error: userCreateError } =
          await supabaseServer
            .from("users")
            .insert({
              full_name: fullName,
              email: normalizedEmail,
              tc_no:
                existing.tc_no && existing.tc_no !== "00000000000"
                  ? existing.tc_no
                  : null,
              password_hash: passwordHash,
              role: "member",
              title: existing.position
                ? `${existing.position} (${tierLabel})`
                : tierLabel,
              member_no: memberNo,
              phone: existing.phone || null,
            })
            .select("id, email, member_no")
            .single();

        if (userCreateError || !createdUser) {
          return NextResponse.json(
            {
              error: `Üye hesabı oluşturulamadı: ${
                userCreateError?.message || "Bilinmeyen hata"
              }`,
            },
            { status: 500 }
          );
        }

        linkedUserId = createdUser.id;
        nextMeta.approved_user_id = createdUser.id;
        nextMeta.approved_member_no = memberNo;
        nextMeta.reviewed_at = new Date().toISOString();

        // Provision current year annual dues record for the newly approved member
        const currentYear = new Date().getFullYear();
        await supabaseServer.from("member_dues").insert({
          user_id: createdUser.id,
          period: `${currentYear} Yılı Üyelik Aidatı (${tierLabel})`,
          amount: tierAmount,
          status: "pending",
        });

        const mailResult = await sendTransactionalEmail({
          to: normalizedEmail,
          subject: `AHİD Üyeliğiniz Onaylandı — Üye No: ${memberNo}`,
          text: `Sayın ${fullName},\n\nAHİD üyelik başvurunuz (${existing.application_no}) Yönetim Kurulu tarafından onaylanmıştır.\n\nÜye Numaranız: ${memberNo}\nE-posta: ${normalizedEmail}\nGeçici Şifreniz: ${tempPassword}\n\nÜye Portalına giriş yaptıktan sonra şifrenizi güncellemenizi öneririz.\n\nSaygılarımızla,\nAHİD Yönetim Kurulu`,
        });

        provisionedAccount = {
          created: true,
          email: normalizedEmail,
          member_no: memberNo,
          temporary_password: tempPassword,
          email_sent: mailResult.sent,
          email_message: mailResult.message,
        };
      }
    }

    const { data: updated, error: updateError } = await supabaseServer
      .from("membership_applications")
      .update({
        status: body.status || existing.status,
        admin_notes: serializeApplicationMeta(nextMeta, nextVisibleNote),
        reviewed_by: auth.user.id,
        user_id: linkedUserId,
      })
      .eq("id", appId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await recordAuditLog({
      actorUserId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action:
        body.status === "approved"
          ? "APPLICATION_APPROVED"
          : body.status === "rejected"
          ? "APPLICATION_REJECTED"
          : "APPLICATION_UPDATED",
      target: existing.application_no,
      details: `${existing.first_name} ${existing.last_name} başvurusu güncellendi (Durum: ${
        body.status || existing.status
      }${
        nextMeta.approved_member_no
          ? `, Üye No: ${nextMeta.approved_member_no}`
          : ""
      })`,
      status: "success",
    });

    const updatedItem = {
      ...updated,
      committees: nextMeta.committees,
      references: nextMeta.references,
      approved_member_no: nextMeta.approved_member_no || null,
      approved_user_id: nextMeta.approved_user_id || updated.user_id || null,
      admin_notes: nextVisibleNote,
    };

    return NextResponse.json({
      success: true,
      application: updatedItem,
      data: updatedItem,
      provisionedAccount,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Geçersiz istek." },
      { status: 400 }
    );
  }
}
