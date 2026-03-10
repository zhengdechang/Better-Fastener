"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    nameEn: "",
    description: "",
    categoryId: "",
    seoTitle: "",
    seoDesc: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/products/${id}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([product, catData]) => {
      if (product.id) {
        setForm({
          name: product.name || "",
          slug: product.slug || "",
          nameEn: product.nameEn || "",
          description: product.description || "",
          categoryId: product.categoryId || "",
          seoTitle: product.seoTitle || "",
          seoDesc: product.seoDesc || "",
        });
        setImages(Array.isArray(product.images) ? product.images : []);
      }
      setCategories(catData.categories || []);
      setLoading(false);
    });
  }, [id]);

  const handleAddImageUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = imageUrl.trim();
    if (!url || !url.startsWith("http")) {
      setImageError("请输入有效的图片 URL");
      return;
    }
    setImageError("");
    setImageLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImageError(data.error || "添加失败");
        return;
      }
      setImages(data.images || []);
      setImageUrl("");
    } catch {
      setImageError("网络错误");
    } finally {
      setImageLoading(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setImageError("");
    setImageLoading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch(`/api/admin/products/${id}/images`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setImageError(data.error || "上传失败");
        return;
      }
      setImages(data.images || []);
    } catch {
      setImageError("网络错误");
    } finally {
      setImageLoading(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = async (index: number) => {
    setImageLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${id}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index }),
      });
      const data = await res.json();
      if (res.ok) setImages(data.images || []);
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          categoryId: form.categoryId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "保存失败");
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-zinc-500">加载中...</p>;

  return (
    <div>
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="text-zinc-500 hover:text-zinc-700">
          ← 返回
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">编辑商品</h1>
      </div>
      <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-4">
        <div>
          <label className="block text-sm font-medium">名称 *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Slug *</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">英文名</label>
          <input
            type="text"
            value={form.nameEn}
            onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">分类</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            className="mt-1 w-full rounded border px-3 py-2"
          >
            <option value="">无</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">图片管理</label>
          <p className="mt-1 text-xs text-zinc-500">
            图片与商品信息单独管理，在此上传或添加图片 URL
          </p>
          {images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((url, i) => (
                <div key={i} className="group relative">
                  <img
                    src={url}
                    alt=""
                    className="h-20 w-20 rounded border object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23ddd' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='10'%3E加载失败%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    disabled={imageLoading}
                    className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    删除
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-0 left-0 rounded bg-zinc-900 px-1 text-[10px] text-white">主图</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <form onSubmit={handleAddImageUrl} className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="粘贴图片 URL"
                className="w-64 rounded border px-3 py-1.5 text-sm"
              />
              <button
                type="submit"
                disabled={imageLoading}
                className="rounded border px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50"
              >
                添加
              </button>
            </form>
            <label className="cursor-pointer rounded border px-3 py-1.5 text-sm hover:bg-zinc-50">
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadImage}
                disabled={imageLoading}
                className="hidden"
              />
              {imageLoading ? "处理中..." : "本地上传"}
            </label>
          </div>
          {imageError && <p className="mt-1 text-sm text-red-600">{imageError}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">描述</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={4}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">SEO 标题</label>
          <input
            type="text"
            value={form.seoTitle}
            onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">SEO 描述</label>
          <textarea
            value={form.seoDesc}
            onChange={(e) => setForm((f) => ({ ...f, seoDesc: e.target.value }))}
            rows={2}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        {error && <p className="text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-zinc-900 px-6 py-2 text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded border px-6 py-2 hover:bg-zinc-100"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
