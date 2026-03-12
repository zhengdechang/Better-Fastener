import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export type BannerItem = { url: string; link?: string; title?: string; sortOrder?: number };

export async function GET() {
  if (!db) {
    return Response.json({ banners: [] });
  }
  const [row] = await db
    .select()
    .from(schema.siteSettings)
    .where(eq(schema.siteSettings.key, "home_banners"))
    .limit(1);
  if (!row?.value) {
    return Response.json({ banners: [] });
  }
  try {
    const banners = JSON.parse(row.value) as BannerItem[];
    const sorted = Array.isArray(banners)
      ? banners.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      : [];
    return Response.json({ banners: sorted });
  } catch {
    return Response.json({ banners: [] });
  }
}
