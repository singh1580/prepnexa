import Image from "next/image";
import Link from "next/link";
import { brand } from "@/config/brand";

export function PrepstoreLogo() {
  return (
    <Link
      className="brand brand-logo-link inline-flex min-h-11 w-[199px] min-w-[199px] shrink-0 items-center justify-start border-0 bg-transparent p-0 shadow-none max-[899px]:w-[188px] max-[899px]:min-w-[188px] max-[340px]:w-[177px] max-[340px]:min-w-[177px]"
      href="/"
      aria-label={`${brand.name} home`}
    >
      <Image
        className="brand-logo block h-9 w-[199px] max-w-none bg-transparent object-contain object-left shadow-none max-[899px]:h-[34px] max-[899px]:w-[188px] max-[340px]:h-8 max-[340px]:w-[177px]"
        src="/brand/prepstore-logo.svg"
        alt="Prepstore"
        width={728}
        height={160}
        priority
      />
    </Link>
  );
}

export function PrepstoreIcon({ className }: { className?: string }) {
  return (
    <Image
      className={className}
      src="/prepstore-icon.svg"
      alt=""
      width={148}
      height={148}
      aria-hidden="true"
    />
  );
}

export const Brand = PrepstoreLogo;
