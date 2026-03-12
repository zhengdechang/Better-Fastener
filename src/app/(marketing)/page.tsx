import Link from "next/link";
import HomeBanner from "@/components/HomeBanner";

export default function HomePage() {
  return (
    <>
      <HomeBanner />
      <section className="mx-auto max-w-6xl px-4 py-20">
          <h1 className="text-4xl font-bold text-zinc-900">
            Better Fasteners Co., Ltd.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-600">
            专业汽车紧固件、CNC零件、螺丝制造商。位于上海，提供高品质紧固件解决方案。
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/products"
              className="rounded-lg bg-zinc-900 px-6 py-3 text-white hover:bg-zinc-800"
            >
              浏览产品
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-zinc-300 px-6 py-3 text-zinc-700 hover:bg-zinc-100"
            >
              联系我们
            </Link>
          </div>
    </section>
    </>
  );
}
