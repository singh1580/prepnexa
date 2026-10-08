import Link from "next/link";
import { AddToCartButton } from "@/features/commerce/ui/cart-workflow";
import { formatAccessDuration, formatCount, normaliseProductName } from "@/features/catalog/presentation";

export type StorefrontProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  language: string;
  coverObjectKey: string | null;
  mrpPaise: number | null;
  pricePaise: number;
  accessDays: number;
  testCount: number;
  materialCount: number;
  rating: number;
  reviewCount: number;
  subjects?: string[];
  materialTypes?: string[];
  alreadyOwned?: boolean;
};

const price=(paise:number)=>paise===0?"Free":new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(paise/100);
function FileIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.5h7l4 4v13h-11z"/><path d="M13.5 3.5v4h4M9.5 12h5M9.5 16h5"/></svg>}
function TestIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="3.5" width="12" height="17" rx="1.5"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>}
function LanguageIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h10M9 4v2.5c0 4-2 7-5 9M7 11c1.5 2 3.5 3.5 6 4.5M15 10l4 10M13.5 16h7"/></svg>}
function ClockIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></svg>}

export function StorefrontProductCard({product,index=0,variant="catalog",badge}:{product:StorefrontProduct;index?:number;variant?:"featured"|"compact"|"catalog";badge?:string}){
  const discount=product.mrpPaise&&product.mrpPaise>product.pricePaise?Math.round((1-product.pricePaise/product.mrpPaise)*100):0;
  const productName=normaliseProductName(product.name);
  return <article className={`store-product-card store-product-${variant}`}>
    <Link className={`store-product-cover cover-tone-${index%6}${product.coverObjectKey?" uploaded-cover":""}`} href={`/packages/${product.slug}`} style={product.coverObjectKey?{backgroundImage:`url(/api/catalog/products/${product.id}/cover)`}:undefined}>
      {badge?<span className="store-badge">{badge}</span>:null}<span className="cover-title"><b>{productName.replace(/\bpackage\b/ig,"").trim()}</b><small>Complete Package</small></span>
    </Link>
    <div className="store-product-body">
      <div className="store-content-counts"><span><FileIcon/>{formatCount(product.materialCount,"material")}</span><span><TestIcon/>{formatCount(product.testCount,"test")}</span></div>
      <Link className="store-product-title" href={`/packages/${product.slug}`}>{productName}</Link>
      {variant!=="compact"?<p>{product.description||"Expert-curated study material, practice tests and clear explanations in one complete package."}</p>:null}
      {variant!=="compact"?<div className="store-product-facts"><span><LanguageIcon/>{product.language==="BILINGUAL"?"English & Hindi":product.language.toLowerCase().replace(/^./,letter=>letter.toUpperCase())}</span><span><ClockIcon/>{formatAccessDuration(product.accessDays)} access</span></div>:null}
      <div className="store-price-row"><strong>{price(product.pricePaise)}</strong>{product.mrpPaise&&product.mrpPaise>product.pricePaise?<del>{price(product.mrpPaise)}</del>:null}{discount>0?<span>{discount}% off</span>:null}</div>
      {variant!=="compact"?<div className="store-card-actions"><Link className="store-outline-action" href={`/packages/${product.slug}`}>View details</Link>{product.alreadyOwned?<Link className="store-cart-action store-owned-action" href={`/dashboard/courses/${product.slug}`}>Open package →</Link>:<AddToCartButton productId={product.id} className="store-cart-action"/>}</div>:null}
    </div>
  </article>;
}
