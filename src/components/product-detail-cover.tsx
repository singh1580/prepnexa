"use client";

import Image from "next/image";
import { useState } from "react";
import { normaliseProductName } from "@/features/catalog/presentation";

export function ProductDetailCover({
  productId,
  name,
  hasCover,
}: {
  productId: string;
  name: string;
  hasCover: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = hasCover && !failed;
  const productName = normaliseProductName(name);
  return (
    <div
      className={`relative min-h-[25.5rem] overflow-hidden rounded-[0.55rem] text-white shadow-[inset_0_0_0_1px_#ffffff20] max-[800px]:min-h-[22rem] ${
        showImage
          ? "bg-[#eee]"
          : "bg-[linear-gradient(135deg,#003653_0%,#083d5a_32%,#f17846_100%)] p-8 after:absolute after:right-[-5rem] after:bottom-[-4rem] after:h-[17rem] after:w-[17rem] after:rotate-[18deg] after:border-[3.5rem] after:border-[#ffffff18]"
      }`}
    >
      {showImage ? (
        <Image
          src={`/api/catalog/products/${productId}/cover`}
          alt={`${productName} cover`}
          fill
          className="object-cover"
          sizes="(max-width: 800px) 100vw, 35vw"
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          <span className="relative z-[1] font-extrabold text-[#ff7241]">
            Prepstore
          </span>
          <strong className="relative z-[1] mt-[2.2rem] mb-2 block text-[clamp(2.2rem,4.2vw,4.7rem)] leading-[0.9] tracking-[-0.06em]">
            {productName.replace(/\b(package|preparation)\b/gi, "").trim()}
          </strong>
          <p className="relative z-[1] max-w-64 rounded-[0.3rem] border border-white/50 p-[0.55rem] font-bold">
            Complete Preparation Package
          </p>
          <ul className="relative z-[1] mt-12 grid list-none gap-[0.7rem] p-0 text-[0.82rem] [&_li]:before:mr-[0.6rem] [&_li]:before:text-[#ff7545] [&_li]:before:content-['✓']">
            <li>Structured study resources</li>
            <li>Practice tests</li>
            <li>Clear explanations</li>
            <li>Progress in one place</li>
          </ul>
        </>
      )}
    </div>
  );
}
