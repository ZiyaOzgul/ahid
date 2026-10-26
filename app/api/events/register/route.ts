import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_id, full_name, email, phone, organization, title, ticket_type } = body;

    if (!event_id || !full_name || !email) {
      return NextResponse.json(
        { success: false, error: "Etkinlik seçimi, ad soyad ve e-posta zorunludur." },
        { status: 400 }
      );
    }

    const registration = {
      event_id: Number(event_id),
      full_name,
      email,
      phone: phone || null,
      organization: organization || null,
      title: title || null,
      ticket_type: ticket_type || "standart",
      status: "confirmed",
    };

    let supabaseConnected = false;
    let savedReg = null;

    try {
      const { data, error } = await supabase
        .from("event_registrations")
        .insert(registration)
        .select()
        .single();

      if (!error && data) {
        savedReg = data;
        supabaseConnected = true;
      }
    } catch {
      // Supabase failed
    }

    // SQLite fallback if offline
    if (!supabaseConnected) {
      try {
        const db = getDb();
        db.prepare(`
          CREATE TABLE IF NOT EXISTS event_registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER,
            full_name TEXT,
            email TEXT,
            phone TEXT,
            organization TEXT,
            title TEXT,
            ticket_type TEXT,
            status TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();

        const info = db.prepare(`
          INSERT INTO event_registrations (event_id, full_name, email, phone, organization, title, ticket_type, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          registration.event_id,
          registration.full_name,
          registration.email,
          registration.phone,
          registration.organization,
          registration.title,
          registration.ticket_type,
          registration.status
        );
        savedReg = { id: info.lastInsertRowid, ...registration };
      } catch (err) {
        console.error("Local SQLite event registration error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Etkinlik kaydınız başarıyla oluşturuldu.",
      registration: savedReg,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
