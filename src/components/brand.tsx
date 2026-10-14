import Image from "next/image";
import Link from "next/link";
import { brand } from "@/config/brand";

export function PrepstoreLogo() {
  return (
    <Link
      className="brand brand-logo-link"
      href="/"
      aria-label={`${brand.name} home`}
    >
      <Image
        className="brand-logo"
        src="/brand/prepstore-logo.svg"
        alt="Prepstore"
        width={199}
        height={36}
        priority
      />
    </Link>
  );
}

export const Brand = PrepstoreLogo;
