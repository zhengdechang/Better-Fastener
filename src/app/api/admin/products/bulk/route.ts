import { NextRequest } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getAdminAuthContext } from "@/lib/auth/api-key";
import { logAdminAction } from "@/lib/audit";

type BulkProductInput = {
  name: string;
  nameEn?: string | null;
  modelNo?: string | null;
  description?: string | null;
  categorySlug?: string | null;
  slug?: string | null;
  images?: string[] | string | null;
  material?: string | null;
  standard?: string | null;
  size?: string | null;
  surfaceTreatment?: string | null;
  hardness?: string | null;
  application?: string | null;
  seoTitle?: string | null;
  seoDesc?: string | null;
  specs?: Record<string, unknown> | null;
};

type BulkResult = {
  name: string;
  slug: string;
  ok: boolean;
  action: "create" | "update";
  error?: string;
};

function toSlug(s: string): string {
  return (
    String(s)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\u4e00-\u9fa5-]/g, "")
      .slice(0, 150) || "product"
  );
}

export async function POST(request: NextRequest) {
  const context = await getAdminAuthContext(request);
  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!db) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }
  const database = db;

  const body = await request.json();
  const { products: rawProducts, defaultCategoryId } = body as {
    products: BulkProductInput[];
    defaultCategoryId?: string | null;
  };

  if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
    return Response.json({ error: "products 数组不能为空" }, { status: 400 });
  }

  const results: BulkResult[] = [];
  const usedSlugs = new Set<string>();

  const getCategoryId = async (rowSlug?: string | null): Promise<string | null> => {
    if (rowSlug) {
      const [cat] = await database
        .select({ id: schema.categories.id })
        .from(schema.categories)
        .where(eq(schema.categories.slug, rowSlug))
        .limit(1);
      if (cat) return cat.id;
    }
    return defaultCategoryId || null;
  };

  const resolveSlug = (base: string): string => {
    let slug = base;
    let n = 1;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${++n}`;
    }
    usedSlugs.add(slug);
    return slug;
  };

  const str = (v: unknown) => (v != null ? String(v).trim() || null : null);

  for (const p of rawProducts) {
    const name = String(p?.name || "").trim();
    if (!name) {
      results.push({ name: "(空)", slug: "", ok: false, action: "create", error: "名称为空" });
      continue;
    }

    const baseSlug = p.slug ? toSlug(p.slug) : p.nameEn ? toSlug(p.nameEn) : toSlug(name);
    const slug = resolveSlug(baseSlug);
    const categoryId = await getCategoryId(p.categorySlug);

    const imagesRaw = p.images;
    const images: string[] | null = Array.isArray(imagesRaw)
      ? (imagesRaw.map((u) => str(u)).filter(Boolean) as string[])
      : typeof imagesRaw === "string"
        ? imagesRaw
            .split(/[;|]/)
            .map((u) => u.trim())
            .filter(Boolean) || null
        : null;

    const specsBase =
      p.specs && typeof p.specs === "object" && !Array.isArray(p.specs)
        ? (p.specs as Record<string, unknown>)
        : {};
    const specs: Record<string, unknown> = {
      ...specsBase,
      ...(str(p.modelNo) && { modelNo: str(p.modelNo) }),
      ...(str(p.material) && { material: str(p.material) }),
      ...(str(p.standard) && { standard: str(p.standard) }),
      ...(str(p.size) && { size: str(p.size) }),
      ...(str(p.surfaceTreatment) && { surfaceTreatment: str(p.surfaceTreatment) }),
      ...(str(p.hardness) && { hardness: str(p.hardness) }),
      ...(str(p.application) && { application: str(p.application) }),
    };
    const hasSpecs = Object.keys(specs).length > 0;

    try {
      const existing = await database
        .select()
        .from(schema.products)
        .where(eq(schema.products.slug, slug))
        .limit(1);

      const commonData = {
        name,
        slug,
        nameEn: str(p.nameEn),
        description: str(p.description),
        categoryId,
        images: images && images.length > 0 ? images : null,
        specs: hasSpecs ? specs : null,
        seoTitle: str(p.seoTitle),
        seoDesc: str(p.seoDesc),
      };

      let product;
      let action: BulkResult["action"];

      if (existing.length > 0) {
        // 仅更新有提供的字段，支持 null 值（清空）
        const updateData: Partial<typeof commonData> = {};
        const setIfProvided = <K extends keyof typeof commonData>(
          key: K,
          value: (typeof commonData)[K],
          provided: boolean,
        ) => {
          if (provided) {
            updateData[key] = value;
          }
        };

        setIfProvided("name", commonData.name, true);
        setIfProvided("slug", commonData.slug, true);
        setIfProvided("nameEn", commonData.nameEn ?? null, Object.prototype.hasOwnProperty.call(p, "nameEn"));
        setIfProvided(
          "description",
          commonData.description ?? null,
          Object.prototype.hasOwnProperty.call(p, "description"),
        );
        setIfProvided(
          "categoryId",
          commonData.categoryId ?? null,
          Object.prototype.hasOwnProperty.call(p, "categorySlug"),
        );
        setIfProvided(
          "images",
          commonData.images ?? null,
          Object.prototype.hasOwnProperty.call(p, "images"),
        );
        setIfProvided(
          "specs",
          commonData.specs ?? null,
          hasSpecs || Object.prototype.hasOwnProperty.call(p, "specs"),
        );
        setIfProvided(
          "seoTitle",
          commonData.seoTitle ?? null,
          Object.prototype.hasOwnProperty.call(p, "seoTitle"),
        );
        setIfProvided(
          "seoDesc",
          commonData.seoDesc ?? null,
          Object.prototype.hasOwnProperty.call(p, "seoDesc"),
        );

        [product] = await database
          .update(schema.products)
          .set(updateData)
          .where(eq(schema.products.id, existing[0].id))
          .returning();

        action = "update";
      } else {
        [product] = await database.insert(schema.products).values(commonData).returning();
        action = "create";
      }

      await logAdminAction({
        request,
        context,
        action,
        resource: "product",
        payload: { id: product.id, slug: product.slug },
      });

      results.push({ name, slug, ok: true, action });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "写入失败";
      results.push({ name, slug: baseSlug, ok: false, action: "create", error: msg });
    }
  }

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  return Response.json({
    total: rawProducts.length,
    succeeded,
    failed: failed.length,
    results,
  });
}
