import { NextRequest } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getAdminAuthContext } from "@/lib/auth/api-key";

export type StorageItem = {
  url: string;
  source: "product" | "banner";
  productId?: string;
  productName?: string;
};

/** 聚合所有图片：商品 + Banner */
export async function GET(request: NextRequest) {
  const context = await getAdminAuthContext(request);
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!db) return Response.json({ items: [] });

  const items: StorageItem[] = [];

  const products = await db.select({ id: schema.products.id, name: schema.products.name, images: schema.products.images }).from(schema.products);
  for (const p of products) {
    const imgs = (p.images as string[] | null) || [];
    for (const url of imgs) {
      if (url) items.push({ url, source: "product", productId: p.id, productName: p.name });
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
        for (const b of banners) {
          if (b?.url) items.push({ url: b.url, source: "banner" });
        }
      }
    } catch {
      /* ignore */
    }
  }

  return Response.json({ items });
}
