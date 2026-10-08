import Image from "next/image";
import Link from "next/link";
import { StorefrontProductCard } from "@/components/storefront-product-card";
import { getCurrentAuth } from "@/features/auth/authorization";
import { listAvailableProducts } from "@/features/catalog/repository";

function SearchIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>}
export default async function Home(){
  const auth=await getCurrentAuth();
  const products=await listAvailableProducts(auth?.user.id);
  const popular=[...products].sort((a,b)=>(b.reviewCount*10+b.rating+b.testCount)-(a.reviewCount*10+a.rating+a.testCount));
  const featured=popular.slice(0,3);const best=popular.slice(0,4);const arrivals=[...products].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0,4);
  return <main className="store-home">
    <section className="store-hero"><div className="store-hero-media"><Image className="store-hero-image" src="/images/prepstore-hero.webp" alt="Student preparing for an exam with Prepstore" fill priority sizes="100vw"/><div className="hero-handwriting" aria-hidden="true">Prepare<br/>Practice<br/>Progress<i/></div></div><div className="store-hero-content"><span>YOUR EXAM PREPARATION PARTNER</span><h1>Find the right<br/>package for your<br/>next exam</h1><p>Access expert-curated study material, video lectures, notes and test series for India&apos;s top competitive exams.</p><form className="hero-search" action="/packages"><SearchIcon/><input name="q" aria-label="Search exams, subjects or packages" placeholder="Search for exams, subjects or packages..."/><button type="submit">Search</button></form></div></section>
    <section className="store-shelf"><header><h2>Featured packages</h2><Link href="/packages">View all packages <span>→</span></Link></header>{featured.length?<div className="featured-store-grid">{featured.map((product,index)=><StorefrontProductCard key={product.id} product={product} index={index} variant="featured" badge={index===0?"Bestseller":undefined}/>)}</div>:<div className="store-empty">Packages are being prepared.</div>}</section>
    {best.length?<section className="store-shelf compact-shelf"><header><h2>Best sellers</h2><Link href="/packages?sort=popularity">View all <span>→</span></Link></header><div className="compact-store-grid">{best.map((product,index)=><StorefrontProductCard key={product.id} product={product} index={index+1} variant="compact"/>)}</div></section>:null}
    {arrivals.length?<section className="store-shelf compact-shelf"><header><h2>New arrivals</h2><Link href="/packages?sort=latest">View all <span>→</span></Link></header><div className="compact-store-grid">{arrivals.map((product,index)=><StorefrontProductCard key={product.id} product={product} index={index+2} variant="compact"/>)}</div></section>:null}
  </main>;
}
