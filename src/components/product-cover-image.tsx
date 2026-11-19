"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { productCoverUrl } from "@/features/catalog/cover";

export function ProductCoverImage({
  productId,
  coverVersion,
  alt,
  sizes,
  className = "object-contain",
  fallback,
}: {
  productId: string;
  coverVersion?: string | null;
  alt: string;
  sizes: string;
  className?: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return fallback;
  return (
    <Image
      src={productCoverUrl(productId, coverVersion)}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
