import { NextRequest } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getAdminAuthContext } from "@/lib/auth/api-key";
import { logAdminAction } from "@/lib/audit";
import { put } from "@vercel/blob";

export type BannerItem = { url: string; link?: string; title?: string; sortOrder?: number };

async function getBanners(): Promise<BannerItem[]> {
  if (!db) return [];
  const [row] = await db
    .select()
    .from(schema.siteSettings)
    .where(eq(schema.siteSettings.key, "home_banners"))
    .limit(1);
  if (!row?.value) return [];
  try {
    const b = JSON.parse(row.value) as BannerItem[];
    return Array.isArray(b) ? b : [];
  } catch {
    return [];
  }
}

async function saveBanners(banners: BannerItem[]) {
  if (!db) throw new Error("Database unavailable");
  await db
    .insert(schema.siteSettings)
    .values({ key: "home_banners", value: JSON.stringify(banners), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.siteSettings.key,
      set: { value: JSON.stringify(banners), updatedAt: new Date() },
    });
}

export async function GET(request: NextRequest) {
  const context = await getAdminAuthContext(request);
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const banners = await getBanners();
  return Response.json({ banners });
}

export async function PUT(request: NextRequest) {
  const context = await getAdminAuthContext(request);
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });
  const body = await request.json();
  const banners = body.banners as BannerItem[];
  if (!Array.isArray(banners)) {
    return Response.json({ error: "banners 必须为数组" }, { status: 400 });
  }
  const valid = banners
    .filter((b) => b && typeof b.url === "string" && b.url.trim())
    .map((b, i) => ({
      url: String(b.url).trim(),
      link: b.link ? String(b.link).trim() : undefined,
      title: b.title ? String(b.title).trim() : undefined,
      sortOrder: i,
    }));
  await saveBanners(valid);
  await logAdminAction({ request, context, action: "update", resource: "banners", payload: {} });
  return Response.json({ banners: valid });
}

export async function POST(request: NextRequest) {
  const context = await getAdminAuthContext(request);
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });
  const contentType = request.headers.get("content-type") || "";
  let url: string;
  if (contentType.includes("application/json")) {
    const body = await request.json();
    url = body?.url ? String(body.url).trim() : "";
    if (!url.startsWith("http")) {
      return Response.json({ error: "无效的图片 URL" }, { status: 400 });
    }
  } else if (contentType.includes("multipart/form-data")) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return Response.json({ error: "未配置 BLOB_READ_WRITE_TOKEN" }, { status: 503 });
    }
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !file.type.startsWith("image/")) {
      return Response.json({ error: "请上传图片" }, { status: 400 });
    }
    // 使用 Blob 的读写 Token 写入「公开」存储；文件名重复时自动加随机后缀
    const blob = await put(`banners/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    url = blob.url;
  } else {
    return Response.json({ error: "需要 JSON 或 multipart" }, { status: 400 });
  }
  const banners = await getBanners();
  banners.push({ url, sortOrder: banners.length });
  await saveBanners(banners);
  await logAdminAction({ request, context, action: "create", resource: "banners", payload: {} });
  return Response.json({ banners });
}

export async function DELETE(request: NextRequest) {
  const context = await getAdminAuthContext(request);
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const index = typeof body.index === "number" ? body.index : -1;
  if (index < 0) return Response.json({ error: "请提供 index" }, { status: 400 });
  const banners = await getBanners();
  if (index >= banners.length) return Response.json({ error: "索引无效" }, { status: 400 });
  banners.splice(index, 1);
  await saveBanners(banners.map((b, i) => ({ ...b, sortOrder: i })));
  await logAdminAction({ request, context, action: "delete", resource: "banners", payload: {} });
  return Response.json({ banners });
}
