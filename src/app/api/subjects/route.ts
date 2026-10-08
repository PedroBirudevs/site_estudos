import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function POST(req: Request) {
  const { name, description } = (await req.json()) as { name?: string; description?: string };
  if (!name?.trim()) return NextResponse.json({ error: "Dê um nome para a matéria." }, { status: 400 });

  const { data, error } = await db()
    .from("subjects")
    .insert({ name: name.trim(), description: description?.trim() || null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
