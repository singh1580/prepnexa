import Link from "next/link";
import { brand } from "@/config/brand";

export function Brand() {
  return <Link className="brand" href="/" aria-label={`${brand.name} home`}><span className="brand-mark" aria-hidden="true"><i /><i /></span><span className="brand-word"><b>Prep</b><em>store</em></span></Link>;
}
