import { NextRequest } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getAdminAuthContext } from "@/lib/auth/api-key";
import { logAdminAction } from "@/lib/audit";
import { put } from "@vercel/blob";

/** 添加图片：POST 支持 multipart 文件或 JSON { url } */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getAdminAuthContext(request);
  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!db) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }
  const { id } = await params;

  const [product] = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.id, id))
    .limit(1);
  if (!product) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") || "";
  let newUrl: string | null = null;

  if (contentType.includes("application/json")) {
    const body = await request.json();
    const url = body?.url ? String(body.url).trim() : null;
    if (!url || !url.startsWith("http")) {
      return Response.json({ error: "无效的图片 URL" }, { status: 400 });
    }
    newUrl = url;
  } else if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !file.type.startsWith("image/")) {
      return Response.json({ error: "请上传图片文件" }, { status: 400 });
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return Response.json(
        { error: "未配置 BLOB_READ_WRITE_TOKEN，请使用 URL 添加图片" },
        { status: 503 }
      );
    }
    // 使用 Blob 的读写 Token，将文件写入私有存储
    const blob = await put(`products/${id}/${file.name}`, file, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    newUrl = blob.url;
  } else {
    return Response.json(
      { error: "请使用 multipart/form-data 上传文件或 application/json 提供 url" },
      { status: 400 }
    );
  }

  const current = (product.images as string[] | null) || [];
  const updated = [...current, newUrl];

  await db
    .update(schema.products)
    .set({ images: updated, updatedAt: new Date() })
    .where(eq(schema.products.id, id));

  await logAdminAction({
    request,
    context,
    action: "update",
    resource: "product",
    payload: { id, slug: product.slug, imagesCount: updated.length },
  });

  return Response.json({ images: updated });
}

/** 删除图片：POST body { index: number } 或 { url: string } */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getAdminAuthContext(request);
  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!db) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }
  const { id } = await params;

  const [product] = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.id, id))
    .limit(1);
  if (!product) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const current = (product.images as string[] | null) || [];
  let updated: string[];

  if (typeof body.index === "number") {
    if (body.index < 0 || body.index >= current.length) {
      return Response.json({ error: "无效的索引" }, { status: 400 });
    }
    updated = current.filter((_, i) => i !== body.index);
  } else if (typeof body.url === "string") {
    const url = body.url.trim();
    updated = current.filter((u) => u !== url);
    if (updated.length === current.length) {
      return Response.json({ error: "未找到该图片" }, { status: 404 });
    }
  } else {
    return Response.json({ error: "请提供 index 或 url" }, { status: 400 });
  }

  await db
    .update(schema.products)
    .set({
      images: updated.length > 0 ? updated : null,
      updatedAt: new Date(),
    })
    .where(eq(schema.products.id, id));

  await logAdminAction({
    request,
    context,
    action: "update",
    resource: "product",
    payload: { id, slug: product.slug, imagesCount: updated.length },
  });

  return Response.json({ images: updated });
}
