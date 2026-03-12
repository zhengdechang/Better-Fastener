import Link from "next/link";
import { getSession } from "@/lib/auth";
import { LogoutButton } from "../LogoutButton";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="flex">
        <aside className="w-56 border-r border-zinc-200 bg-white p-4">
          <h2 className="text-lg font-bold text-zinc-900">管理后台</h2>
          {session && (
            <p className="mt-1 text-sm text-zinc-500">{session.email}</p>
          )}
          <nav className="mt-6 space-y-1">
            <Link
              href="/admin"
              className="block rounded px-3 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              概览
            </Link>
            <Link
              href="/admin/products"
              className="block rounded px-3 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              商品管理
            </Link>
            <Link
              href="/admin/banners"
              className="block rounded px-3 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              Banner 管理
            </Link>
            <Link
              href="/admin/storage"
              className="block rounded px-3 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              存储管理
            </Link>
            <Link
              href="/admin/settings"
              className="block rounded px-3 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              站点设置
            </Link>
            <Link
              href="/admin/forms"
              className="block rounded px-3 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              表单记录
            </Link>
            <Link
              href="/admin/api-keys"
              className="block rounded px-3 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              API Key 管理
            </Link>
          </nav>
          <div className="mt-8">
            <LogoutButton />
          </div>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
