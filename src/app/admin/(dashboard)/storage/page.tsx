"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type StorageItem = {
  url: string;
  source: "product" | "banner";
  productId?: string;
  productName?: string;
};

export default function StoragePage() {
  const [items, setItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    fetch("/api/admin/storage")
      .then((r) => r.json())
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const toggle = (url: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.url)));
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`确定从商品/Banner 中移除选中的 ${selected.size} 张图片？`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/storage/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: Array.from(selected) }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => !selected.has(i.url)));
        setSelected(new Set());
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <p className="text-zinc-500">加载中...</p>;

  const byProduct = items.filter((i) => i.source === "product");
  const byBanner = items.filter((i) => i.source === "banner");

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">存储管理</h1>
      <p className="mt-2 text-sm text-zinc-500">
        查看站点内所有图片（商品图、Banner），支持批量移除（从使用处删除引用）
      </p>

      {selected.size > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "处理中..." : `批量移除 (${selected.size})`}
          </button>
          <button onClick={() => setSelected(new Set())} className="rounded border px-4 py-2 hover:bg-zinc-50">
            取消选择
          </button>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2">
          <input
            type="checkbox"
            checked={items.length > 0 && selected.size === items.length}
            onChange={toggleAll}
          />
          <span className="text-sm font-medium">全选</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item, i) => (
            <div
              key={`${item.url}-${i}`}
              className={`flex flex-col rounded-lg border ${selected.has(item.url) ? "ring-2 ring-zinc-900" : ""}`}
            >
              <label className="flex cursor-pointer flex-col">
                <div className="relative aspect-video overflow-hidden rounded-t-lg bg-zinc-100">
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                  <input
                    type="checkbox"
                    checked={selected.has(item.url)}
                    onChange={() => toggle(item.url)}
                    className="absolute right-2 top-2"
                  />
                </div>
                <div className="p-2 text-xs text-zinc-500">
                  {item.source === "product" ? (
                    <Link href={`/admin/products/${item.productId}`} className="text-blue-600 hover:underline">
                      {item.productName || "商品"}
                    </Link>
                  ) : (
                    <span>Banner</span>
                  )}
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {items.length === 0 && <p className="mt-8 text-zinc-500">暂无图片</p>}
      <p className="mt-4 text-xs text-zinc-500">
        商品图：{byProduct.length} 张 | Banner：{byBanner.length} 张
      </p>
    </div>
  );
}
