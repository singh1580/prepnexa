import { db } from "@/db/client";
import { materialAccessLogs } from "@/db/schema";
import { sql } from "drizzle-orm";

export type StudentMaterial = {
  id: string; title: string; type: "PDF" | "VIDEO" | "FILE"; body: string | null;
  allowDownload: boolean; examName: string; versionId: string; version: number; originalFileName: string | null;
  contentType: string | null; sizeBytes: number | null; privateObjectKey: string | null; checksum: string | null;
  entitlementId: string | null; accessSource: "FREE" | "ENTITLEMENT";
  productId: string; productSlug: string;
};

function rows<T>(value: Awaited<ReturnType<typeof db.execute>>) { return value.rows as T[]; }

const accessSql = (userId: string, productSlug?: string, productId?: string) => sql`
  select m.id, m.title, m.type, m.body, m.allow_download as "allowDownload", 'Prepstore' as "examName",
    v.id as "versionId", v.version, v.original_file_name as "originalFileName", v.content_type as "contentType",
    v.size_bytes as "sizeBytes", v.private_object_key as "privateObjectKey", v.checksum,
    access.product_id as "productId", access.product_slug as "productSlug", access.entitlement_id as "entitlementId",
    case when access.entitlement_id is null then 'FREE' else 'ENTITLEMENT' end as "accessSource"
  from materials m
  join lateral (
    select mv.* from material_versions mv where mv.material_id = m.id
    order by mv.version desc limit 1
  ) v on true
  join lateral (
    select p.id as product_id, p.slug as product_slug, en.id as entitlement_id
    from product_materials pm
    join products p on p.id = pm.product_id
    left join entitlements en on en.product_id = p.id and en.user_id = ${userId}::uuid
      and en.status = 'ACTIVE' and en.starts_at <= now() and en.expires_at > now()
    where pm.material_id = m.id and (${productSlug ?? null}::text is null or p.slug=${productSlug ?? null})
      and (${productId ?? null}::uuid is null or p.id=${productId ?? null}::uuid)
      and ((p.is_live = true and p.price_paise = 0) or en.id is not null)
    order by case when p.slug=${productSlug ?? null} then 0 else 1 end,(en.id is not null) desc limit 1
  ) access on true
`;

export async function listStudentMaterials(userId: string) {
  const result = await db.execute(sql`${accessSql(userId)} order by m.title`);
  return rows<StudentMaterial>(result);
}

export async function findStudentMaterial(materialId: string, userId: string, productSlug?: string) {
  const result = await db.execute(sql`${accessSql(userId, productSlug)} and m.id = ${materialId}::uuid limit 1`);
  return rows<StudentMaterial>(result)[0];
}

export async function findStudentMaterialForProduct(materialId: string, userId: string, productId: string) {
  const result = await db.execute(sql`${accessSql(userId, undefined, productId)} and m.id = ${materialId}::uuid limit 1`);
  return rows<StudentMaterial>(result)[0];
}

export async function logMaterialAccess(input: { userId: string; materialId: string; productId: string; versionId: string; entitlementId: string | null; accessSource: "FREE" | "ENTITLEMENT"; action: "VIEW" | "DOWNLOAD"; requestId: string; ipHash?: string }) {
  await db.insert(materialAccessLogs).values(input);
}
