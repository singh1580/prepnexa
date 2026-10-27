import Image from "next/image";
import Link from "next/link";
import { brand } from "@/config/brand";

const logoSizes = {
  header: {
    link: "w-[199px] min-w-[199px] max-[899px]:w-[188px] max-[899px]:min-w-[188px] max-[340px]:w-[177px] max-[340px]:min-w-[177px]",
    image:
      "h-9 w-[199px] max-[899px]:h-[34px] max-[899px]:w-[188px] max-[340px]:h-8 max-[340px]:w-[177px]",
  },
  compact: {
    link: "w-[188px] min-w-[188px]",
    image: "h-[34px] w-[188px]",
  },
  mobile: {
    link: "w-[172px] min-w-[172px] min-h-10",
    image: "h-[38px] w-[172px]",
  },
  footer: {
    link: "w-[164px] min-w-[164px] min-h-9",
    image: "h-9 w-[164px]",
  },
  invoice: {
    link: "w-[164px] min-w-[164px] min-h-9",
    image: "h-9 w-[164px]",
  },
} as const;

export function PrepstoreLogo({
  variant = "header",
}: {
  variant?: keyof typeof logoSizes;
}) {
  const size = logoSizes[variant];
  return (
    <Link
      className={`brand brand-logo-link inline-flex min-h-11 shrink-0 items-center justify-start border-0 bg-transparent p-0 shadow-none ${size.link}`}
      href="/"
      aria-label={`${brand.name} home`}
    >
      <Image
        className={`brand-logo block max-w-none bg-transparent object-contain object-left shadow-none ${size.image}`}
        src="/brand/prepstore-logo.svg"
        alt="Prepstore"
        width={728}
        height={160}
        priority
      />
    </Link>
  );
}

export function PrepstoreIcon({ className = "block size-full object-contain" }: { className?: string }) {
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
