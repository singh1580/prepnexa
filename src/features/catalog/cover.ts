export function productCoverUrl(
  productId: string,
  coverObjectKey?: string | null,
) {
  const fileName = coverObjectKey?.split("/").at(-1);
  const version = fileName ? `?v=${encodeURIComponent(fileName)}` : "";
  return `/media/product-covers/${productId}${version}`;
}
