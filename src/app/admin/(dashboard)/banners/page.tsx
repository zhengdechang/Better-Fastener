"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type BannerItem = { url: string; link?: string; title?: string; sortOrder?: number };

export default function BannersPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/admin/banners")
      .then((r) => r.json())
      .then((data) => setBanners(data.banners || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = imageUrl.trim();
    if (!url.startsWith("http")) {
      setError("请输入有效图片 URL");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "添加失败");
        return;
      }
      setBanners(data.banners || []);
      setImageUrl("");
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setError("");
    setSaving(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/admin/banners", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "上传失败");
        return;
      }
      setBanners(data.banners || []);
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  };

  const handleRemove = async (index: number) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/banners", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index }),
      });
      const data = await res.json();
      if (res.ok) setBanners(data.banners || []);
    } finally {
      setSaving(false);
    }
  };

  const handleMove = (from: number, to: number) => {
    if (to < 0 || to >= banners.length) return;
    const next = [...banners];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setBanners(next);
    setSaving(true);
    fetch("/api/admin/banners", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banners: next }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, banners: d.banners })))
      .then(({ ok, banners: b }) => ok && setBanners(b || next))
      .finally(() => setSaving(false));
  };

  if (loading) return <p className="text-zinc-500">加载中...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Banner 管理</h1>
      <p className="mt-2 text-sm text-zinc-500">首页顶部轮播图，按顺序展示</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <form onSubmit={handleAddUrl} className="flex gap-2">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="图片 URL"
            className="rounded border px-3 py-2"
          />
          <button type="submit" disabled={saving} className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50">
            添加
          </button>
        </form>
        <label className="cursor-pointer rounded border px-4 py-2 hover:bg-zinc-50">
          <input type="file" accept="image/*" onChange={handleUpload} disabled={saving} className="hidden" />
          {saving ? "处理中..." : "本地上传"}
        </label>
      </div>
      {error && <p className="mt-2 text-red-600">{error}</p>}

      <div className="mt-8 space-y-4">
        {banners.map((b, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border bg-white p-4">
            <img src={b.url} alt="" className="h-24 w-40 rounded object-cover" />
            <div className="flex-1">
              <p className="text-sm text-zinc-500">{b.url}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleMove(i, i - 1)}
                disabled={i === 0 || saving}
                className="rounded border px-2 py-1 text-sm disabled:opacity-50"
              >
                上移
              </button>
              <button
                type="button"
                onClick={() => handleMove(i, i + 1)}
                disabled={i === banners.length - 1 || saving}
                className="rounded border px-2 py-1 text-sm disabled:opacity-50"
              >
                下移
              </button>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                disabled={saving}
                className="rounded bg-red-100 px-2 py-1 text-sm text-red-700 hover:bg-red-200 disabled:opacity-50"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
      {banners.length === 0 && <p className="mt-8 text-zinc-500">暂无 Banner，请添加</p>}
    </div>
  );
}
