import { NextRequest } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getAdminAuthContext } from "@/lib/auth/api-key";
import { logAdminAction } from "@/lib/audit";

/** 批量移除图片：从商品或 Banner 中删除指定 URL */
export async function POST(request: NextRequest) {
  const context = await getAdminAuthContext(request);
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });

  const body = await request.json();
  const urls = body.urls as string[];
  if (!Array.isArray(urls) || urls.length === 0) {
    return Response.json({ error: "请提供 urls 数组" }, { status: 400 });
  }
  const urlSet = new Set(urls.map((u) => String(u).trim()).filter(Boolean));

  let removed = 0;

  const products = await db.select().from(schema.products);
  for (const p of products) {
    const imgs = (p.images as string[] | null) || [];
    const next = imgs.filter((u) => !urlSet.has(u));
    if (next.length !== imgs.length) {
      await db
        .update(schema.products)
        .set({ images: next.length ? next : null, updatedAt: new Date() })
        .where(eq(schema.products.id, p.id));
      removed += imgs.length - next.length;
    }
  }

  const [bannersRow] = await db
    .select()
    .from(schema.siteSettings)
    .where(eq(schema.siteSettings.key, "home_banners"))
    .limit(1);
  if (bannersRow?.value) {
    try {
      const banners = JSON.parse(bannersRow.value) as { url: string }[];
      if (Array.isArray(banners)) {
        const next = banners.filter((b) => b?.url && !urlSet.has(b.url));
        if (next.length !== banners.length) {
          await db
            .insert(schema.siteSettings)
            .values({ key: "home_banners", value: JSON.stringify(next), updatedAt: new Date() })
            .onConflictDoUpdate({
              target: schema.siteSettings.key,
              set: { value: JSON.stringify(next), updatedAt: new Date() },
            });
          removed += banners.length - next.length;
        }
      }
    } catch {
      /* ignore */
    }
  }

  await logAdminAction({
    request,
    context,
    action: "update",
    resource: "storage",
    payload: { urls: urls.length, removed },
  });

  return Response.json({ ok: true, removed });
}
