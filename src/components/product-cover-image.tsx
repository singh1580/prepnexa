"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

export function ProductCoverImage({
  productId,
  alt,
  sizes,
  className = "object-cover",
  fallback,
}: {
  productId: string;
  alt: string;
  sizes: string;
  className?: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return fallback;
  return (
    <Image
      src={`/api/catalog/products/${productId}/cover`}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}
