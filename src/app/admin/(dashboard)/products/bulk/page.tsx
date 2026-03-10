"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";

const PLACEHOLDER = `六角螺栓 M8,Hex Bolt M8,,高强度六角螺栓 M8 规格,汽车紧固件,,,,,,,,
氧化黑碳钢平垫圈,Oxide Black HDG Flat Washer,FW-CS-0001,碳钢平垫圈 工业用,flat-washer,https://img1.jpg;https://img2.jpg,Carbon Steel,DIN 125,M3-M60,Zinc Plated,Grade 4.8/8.8,Automotive,,`;

type ProductInput = {
  name: string;
  nameEn?: string;
  modelNo?: string;
  description?: string;
  categorySlug?: string;
  images?: string[];
  material?: string;
  standard?: string;
  size?: string;
  surfaceTreatment?: string;
  hardness?: string;
  application?: string;
  seoTitle?: string;
  seoDesc?: string;
};
type Result = { name: string; slug: string; ok: boolean; error?: string };

function productToRow(p: ProductInput): string[] {
  const imgs = Array.isArray(p.images) ? p.images.join(";") : "";
  return [
    p.name, p.nameEn || "", p.modelNo || "", p.description || "", p.categorySlug || "",
    imgs, p.material || "", p.standard || "", p.size || "", p.surfaceTreatment || "",
    p.hardness || "", p.application || "", p.seoTitle || "", p.seoDesc || "",
  ];
}

function productsToText(products: ProductInput[]): string {
  return products
    .filter((p) => p.name?.trim())
    .map((p) => productToRow(p).join(","))
    .join("\n");
}

/** CSV 解析，支持引号包裹的字段 */
function parseCSV(content: string): ProductInput[] {
  const lines: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (c === '"') {
      inQuote = !inQuote;
    } else if ((c === "\n" || c === "\r") && !inQuote) {
      if (content[i] === "\r" && content[i + 1] === "\n") i++;
      if (current.trim()) lines.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  if (current.trim()) lines.push(current);

  return lines.map((line) => {
    const parts: string[] = [];
    let part = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        q = !q;
      } else if ((c === "," || c === "\t") && !q) {
        parts.push(part.trim());
        part = "";
      } else {
        part += c;
      }
    }
    parts.push(part.trim());
    const imgs = (parts[5] || "").split(/[;|]/).map((s) => s.trim()).filter(Boolean);
    return {
      name: parts[0] || "",
      nameEn: parts[1] || undefined,
      modelNo: parts[2] || undefined,
      description: parts[3] || undefined,
      categorySlug: parts[4] || undefined,
      images: imgs.length ? imgs : undefined,
      material: parts[6] || undefined,
      standard: parts[7] || undefined,
      size: parts[8] || undefined,
      surfaceTreatment: parts[9] || undefined,
      hardness: parts[10] || undefined,
      application: parts[11] || undefined,
      seoTitle: parts[12] || undefined,
      seoDesc: parts[13] || undefined,
    };
  });
}

/** JSON 解析，支持完整字段 */
function parseJSON(content: string): ProductInput[] {
  const data = JSON.parse(content);
  const arr = Array.isArray(data) ? data : data.products ? data.products : [data];
  return arr.map((row: Record<string, unknown>) => {
    const v = (key: string, ...alts: string[]) => {
      const val = row[key] ?? alts.reduce((a, k) => a ?? row[k], null as unknown);
      return val != null ? String(val).trim() || undefined : undefined;
    };
    const imgs = row.images ?? row.图片;
    const images = Array.isArray(imgs)
      ? (imgs as unknown[]).map((u) => String(u).trim()).filter(Boolean)
      : typeof imgs === "string"
        ? imgs.split(/[;|]/).map((s) => s.trim()).filter(Boolean)
        : undefined;
    const specs = row.specs && typeof row.specs === "object" && !Array.isArray(row.specs) ? (row.specs as Record<string, unknown>) : {};
    return {
      name: String(row.name ?? row.名称 ?? "").trim(),
      nameEn: v("nameEn", "name_en", "英文名"),
      modelNo: v("modelNo", "model_no", "型号"),
      description: v("description", "描述"),
      categorySlug: v("categorySlug", "category_slug", "分类"),
      images: images?.length ? images : undefined,
      material: v("material", "材质") ?? (specs.material ? String(specs.material).trim() : undefined),
      standard: v("standard", "标准") ?? (specs.standard ? String(specs.standard).trim() : undefined),
      size: v("size", "规格") ?? (specs.size ? String(specs.size).trim() : undefined),
      surfaceTreatment: v("surfaceTreatment", "surface_treatment", "表面处理") ?? (specs.surfaceTreatment ? String(specs.surfaceTreatment).trim() : undefined),
      hardness: v("hardness", "硬度") ?? (specs.hardness ? String(specs.hardness).trim() : undefined),
      application: v("application", "应用") ?? (specs.application ? String(specs.application).trim() : undefined),
      seoTitle: v("seoTitle", "seo_title"),
      seoDesc: v("seoDesc", "seo_desc"),
    };
  });
}

const EXCEL_COL_MAP: { keys: string[]; field: keyof ProductInput }[] = [
  { keys: ["name", "名称"], field: "name" },
  { keys: ["nameen", "name_en", "英文", "英文名"], field: "nameEn" },
  { keys: ["modelno", "model_no", "型号"], field: "modelNo" },
  { keys: ["desc", "description", "描述"], field: "description" },
  { keys: ["category", "categoryslug", "分类"], field: "categorySlug" },
  { keys: ["images", "图片"], field: "images" },
  { keys: ["material", "材质"], field: "material" },
  { keys: ["standard", "标准"], field: "standard" },
  { keys: ["size", "规格"], field: "size" },
  { keys: ["surfacetreatment", "表面处理"], field: "surfaceTreatment" },
  { keys: ["hardness", "硬度"], field: "hardness" },
  { keys: ["application", "应用"], field: "application" },
  { keys: ["seotitle", "seo_title"], field: "seoTitle" },
  { keys: ["seodesc", "seo_desc"], field: "seoDesc" },
];

/** Excel 解析，第一行可为表头 */
function parseExcel(buffer: ArrayBuffer): ProductInput[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 }) as (string | number)[][];
  if (rows.length === 0) return [];
  const header = rows[0].map((c) => String(c || "").toLowerCase().replace(/\s/g, ""));
  const isHeader = EXCEL_COL_MAP.some(({ keys }) =>
    keys.some((k) => header.some((h) => h.includes(k) || k.includes(h)))
  );
  const start = isHeader ? 1 : 0;
  const idx = (keys: string[]) => {
    for (const k of keys) {
      const i = header.findIndex((h) => h.includes(k) || k.includes(h));
      if (i >= 0) return i;
    }
    return -1;
  };
  const getVal = (field: keyof ProductInput, colIdx: number, r: (string | number)[]): string | string[] | undefined => {
    if (colIdx < 0 || !r || r[colIdx] == null) return undefined;
    const v = String(r[colIdx]).trim();
    if (!v) return undefined;
    if (field === "images") return v.split(/[;|]/).map((s) => s.trim()).filter(Boolean);
    return v;
  };
  const products: ProductInput[] = [];
  const fieldToCol = (field: keyof ProductInput): number => {
    const i = EXCEL_COL_MAP.findIndex((m) => m.field === field);
    return isHeader ? idx(EXCEL_COL_MAP[i]?.keys ?? []) : i;
  };
  for (let i = start; i < rows.length; i++) {
    const r = rows[i];
    const nameIdx = fieldToCol("name");
    const name = r && nameIdx >= 0 && r[nameIdx] != null ? String(r[nameIdx]).trim() : "";
    if (!name) continue;
    const row: ProductInput = { name };
    for (const { field } of EXCEL_COL_MAP) {
      if (field === "name") continue;
      const colIdx = fieldToCol(field);
      const val = getVal(field, colIdx, r);
      if (val !== undefined) (row as Record<string, unknown>)[field] = val;
    }
    products.push(row);
  }
  return products;
}

function parseLines(text: string): ProductInput[] {
  const lines = text
    .trim()
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const sep = line.includes("\t") ? "\t" : ",";
    const parts = line.split(sep).map((p) => p.trim());
    const imgs = (parts[5] || "").split(/[;|]/).map((s) => s.trim()).filter(Boolean);
    return {
      name: parts[0] || "",
      nameEn: parts[1] || undefined,
      modelNo: parts[2] || undefined,
      description: parts[3] || undefined,
      categorySlug: parts[4] || undefined,
      images: imgs.length ? imgs : undefined,
      material: parts[6] || undefined,
      standard: parts[7] || undefined,
      size: parts[8] || undefined,
      surfaceTreatment: parts[9] || undefined,
      hardness: parts[10] || undefined,
      application: parts[11] || undefined,
      seoTitle: parts[12] || undefined,
      seoDesc: parts[13] || undefined,
    };
  });
}

export default function BulkImportPage() {
  const [categories, setCategories] = useState<Array<{ id: string; slug: string; name: string }>>([]);
  const [text, setText] = useState("");
  const [defaultCategoryId, setDefaultCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ total: number; succeeded: number; failed: number; results: Result[] } | null>(null);
  const [error, setError] = useState("");
  const [fileLoading, setFileLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLoading(true);
    setError("");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let products: ProductInput[] = [];
      if (ext === "json") {
        const text = await file.text();
        products = parseJSON(text);
      } else if (ext === "csv") {
        const text = await file.text();
        products = parseCSV(text);
      } else if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer();
        products = parseExcel(buf);
      } else {
        setError("不支持的文件格式，请上传 .xlsx、.csv 或 .json");
        return;
      }
      const valid = products.filter((p) => p.name?.trim());
      if (valid.length === 0) {
        setError("文件中未找到有效商品（需包含名称列）");
        return;
      }
      setText((prev) => (prev ? prev + "\n" + productsToText(valid) : productsToText(valid)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "文件解析失败");
    } finally {
      setFileLoading(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    const products = parseLines(text);
    if (products.length === 0) {
      setError("请输入至少一行商品数据");
      return;
    }
    if (products.some((p) => !p.name)) {
      setError("每行第一列（名称）不能为空");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products,
          defaultCategoryId: defaultCategoryId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "导入失败");
        return;
      }
      setResult(data);
      if (data.succeeded > 0) {
        setText("");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  const previewCount = parseLines(text).filter((p) => p.name).length;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/products" className="text-zinc-500 hover:text-zinc-700">
          ← 返回商品管理
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900">批量导入商品</h1>
      <p className="mt-2 text-sm text-zinc-500">
        支持完整参数：名称、英文名、型号、描述、分类、图片URL（分号分隔）、材质、标准、规格、表面处理、硬度、应用等，与 Made-in-China 产品结构对齐。格式说明见项目根目录{" "}
        <code className="rounded bg-zinc-100 px-1">BULK_IMPORT_FORMAT.md</code>
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-3xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">上传文件（可选）</label>
          <div className="mt-1 flex items-center gap-2">
            <label className="cursor-pointer rounded border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-50">
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                onChange={handleFileChange}
                disabled={fileLoading}
                className="hidden"
              />
              {fileLoading ? "解析中..." : "选择 Excel / CSV / JSON"}
            </label>
            <span className="text-xs text-zinc-500">
              支持 .xlsx、.csv、.json · 解析后追加到下方列表
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            完整列顺序：名称,英文名,型号,描述,分类,图片URL(分号分隔),材质,标准,规格,表面处理,硬度,应用,SEO标题,SEO描述
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">默认分类（可选）</label>
          <select
            value={defaultCategoryId}
            onChange={(e) => setDefaultCategoryId(e.target.value)}
            className="mt-1 w-full max-w-xs rounded border border-zinc-300 px-3 py-2"
          >
            <option value="">无</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.slug})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500">若每行未指定分类，则使用此默认分类</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">商品列表</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={12}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-mono text-sm"
          />
          <p className="mt-1 text-xs text-zinc-500">
            已识别 {previewCount} 个商品 · Slug 将自动生成（名称/英文名转写，重复时加数字后缀）
          </p>
        </div>

        {error && <p className="text-red-600">{error}</p>}

        {result && (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="font-medium text-zinc-900">
              导入完成：成功 {result.succeeded} 个，失败 {result.failed} 个
            </p>
            {result.results.some((r) => !r.ok) && (
              <ul className="mt-2 space-y-1 text-sm text-red-600">
                {result.results
                  .filter((r) => !r.ok)
                  .map((r, i) => (
                    <li key={i}>
                      {r.name}：{r.error}
                    </li>
                  ))}
              </ul>
            )}
            {result.succeeded > 0 && (
              <Link
                href="/admin/products"
                className="mt-3 inline-block text-sm text-blue-600 hover:underline"
              >
                查看商品列表 →
              </Link>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting || previewCount === 0}
            className="rounded bg-zinc-900 px-6 py-2 text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting ? "导入中..." : `导入 ${previewCount} 个商品`}
          </button>
          <Link href="/admin/products" className="rounded border px-6 py-2 hover:bg-zinc-100">
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
