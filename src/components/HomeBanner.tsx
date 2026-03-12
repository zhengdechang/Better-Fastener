"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type BannerItem = { url: string; link?: string; title?: string };

export default function HomeBanner() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetch("/api/banners")
      .then((r) => r.json())
      .then((data) => setBanners(data.banners || []));
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const current = banners[index];

  return (
    <div className="relative w-full overflow-hidden bg-zinc-900">
      <div className="mx-auto max-w-6xl">
        {current.link ? (
          <Link href={current.link} className="block">
            <img
              src={current.url}
              alt={current.title || "Banner"}
              className="h-64 w-full object-cover md:h-80"
            />
          </Link>
        ) : (
          <img
            src={current.url}
            alt={current.title || "Banner"}
            className="h-64 w-full object-cover md:h-80"
          />
        )}
      </div>
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50"
            aria-label="上一张"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % banners.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50"
            aria-label="下一张"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full transition ${i === index ? "bg-white" : "bg-white/50 hover:bg-white/70"}`}
                aria-label={`第 ${i + 1} 张`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
