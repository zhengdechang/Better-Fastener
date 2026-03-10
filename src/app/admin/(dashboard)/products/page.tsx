"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Array<{ id: string; slug: string; name: string }>>([]);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []));
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定删除「${name}」？`)) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setProducts((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">商品管理</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/products/bulk"
            className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            批量导入
          </Link>
          <Link
            href="/admin/products/new"
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
          >
            新建商品
          </Link>
        </div>
      </div>
      {products.length === 0 ? (
        <p className="mt-8 text-zinc-500">暂无商品</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse border border-zinc-200">
            <thead>
              <tr className="bg-zinc-50">
                <th className="border border-zinc-200 px-4 py-2 text-left text-sm font-medium">
                  名称
                </th>
                <th className="border border-zinc-200 px-4 py-2 text-left text-sm font-medium">
                  Slug
                </th>
                <th className="border border-zinc-200 px-4 py-2 text-left text-sm font-medium">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="border border-zinc-200 px-4 py-2">{p.name}</td>
                  <td className="border border-zinc-200 px-4 py-2 text-zinc-500">
                    {p.slug}
                  </td>
                  <td className="border border-zinc-200 px-4 py-2">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="mr-2 text-blue-600 hover:underline"
                    >
                      编辑
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id, p.name)}
                      className="text-red-600 hover:underline"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
