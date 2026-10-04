import { and, asc, countDistinct, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { materials, productMaterials, products, productTests, tests } from "@/db/schema";
import { productReadySql } from "./readiness";

export async function listAvailableProducts() {
  return db.select({ id: products.id, slug: products.slug, name: products.name, description: products.description, syllabus: products.syllabus, language: products.language, coverObjectKey: products.coverObjectKey, mrpPaise: products.mrpPaise, pricePaise: products.pricePaise, accessDays: products.accessDays, createdAt:products.createdAt, testCount: countDistinct(productTests.testId), materialCount: countDistinct(productMaterials.materialId),rating:sql<number>`coalesce((select round(avg(rating)::numeric,1) from product_reviews r where r.product_id=${products.id}),0)::double precision`,reviewCount:sql<number>`(select count(*)::int from product_reviews r where r.product_id=${products.id})` })
    .from(products).leftJoin(productTests, eq(productTests.productId, products.id)).leftJoin(productMaterials, eq(productMaterials.productId, products.id)).where(and(eq(products.isLive, true), productReadySql(products.id)))
    .groupBy(products.id).orderBy(asc(products.pricePaise), asc(products.name));
}

export async function findAvailableProduct(slug: string) {
  const product = await db.query.products.findFirst({ where: and(eq(products.slug, slug), eq(products.isLive, true), productReadySql(products.id)) });
  if (!product) return null;
  const [testRows, materialRows, reviewRows] = await Promise.all([
    db.select({ id: tests.id, title: tests.title, mode: tests.mode, durationMinutes: tests.durationMinutes, examName: products.name }).from(productTests).innerJoin(tests, eq(tests.id, productTests.testId)).innerJoin(products, eq(products.id, productTests.productId)).where(eq(productTests.productId, product.id)).orderBy(asc(tests.title)),
    db.select({ id: materials.id, title: materials.title, type: materials.type }).from(productMaterials).innerJoin(materials, eq(materials.id, productMaterials.materialId)).where(eq(productMaterials.productId, product.id)).orderBy(asc(materials.title)),
    db.execute(sql`select r.id,r.rating,r.comment,r.created_at as "createdAt",u.name from product_reviews r join users u on u.id=r.user_id where r.product_id=${product.id} order by r.created_at desc limit 50`),
  ]);
  const reviews=reviewRows.rows as {id:string;rating:number;comment:string;createdAt:Date;name:string}[];const rating=reviews.length?reviews.reduce((sum,item)=>sum+item.rating,0)/reviews.length:0;
  return { ...product, tests: testRows, materials: materialRows,reviews,rating,reviewCount:reviews.length };
}

export async function findCartProducts(ids:string[]){if(!ids.length)return[];return db.select({id:products.id,slug:products.slug,name:products.name,description:products.description,coverObjectKey:products.coverObjectKey,mrpPaise:products.mrpPaise,pricePaise:products.pricePaise,currency:products.currency,accessDays:products.accessDays}).from(products).where(and(eq(products.isLive,true),productReadySql(products.id),inArray(products.id,ids))).orderBy(asc(products.name));}

export async function upsertProductReview(productId:string,userId:string,rating:number,comment:string){const result=await db.execute(sql`insert into product_reviews(product_id,user_id,rating,comment,created_at,updated_at) select ${productId}::uuid,${userId}::uuid,${rating},${comment},now(),now() where exists(select 1 from entitlements e where e.product_id=${productId} and e.user_id=${userId} and e.status='ACTIVE') on conflict(product_id,user_id) do update set rating=excluded.rating,comment=excluded.comment,updated_at=now() returning id`);return (result.rows as {id:string}[])[0];}
