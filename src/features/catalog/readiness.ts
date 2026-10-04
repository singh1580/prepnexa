import { sql, type SQLWrapper } from "drizzle-orm";

/**
 * A product is ready to sell only when every linked item can be consumed.
 * Keeping this predicate next to the catalog prevents stale or manually edited
 * records from bypassing the admin publish checks during checkout.
 */
export function productReadySql(productId: SQLWrapper) {
  return sql`(
    (
      exists(select 1 from product_tests ready_pt where ready_pt.product_id=${productId})
      or exists(select 1 from product_materials ready_pm where ready_pm.product_id=${productId})
    )
    and not exists(
      select 1 from product_tests ready_pt
      where ready_pt.product_id=${productId}
        and (
          not exists(select 1 from test_sections ready_ts where ready_ts.test_id=ready_pt.test_id and ready_ts.is_active=true)
          or exists(
            select 1 from test_sections ready_ts
            where ready_ts.test_id=ready_pt.test_id and ready_ts.is_active=true
              and not exists(select 1 from test_questions ready_tq where ready_tq.section_id=ready_ts.id)
          )
        )
    )
    and not exists(
      select 1 from product_materials ready_pm
      where ready_pm.product_id=${productId}
        and not exists(select 1 from material_versions ready_mv where ready_mv.material_id=ready_pm.material_id)
    )
  )`;
}
