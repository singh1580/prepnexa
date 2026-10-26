import Link from "next/link";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/errors/app-error";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getMaterial } from "@/features/admin-catalog/service";
import {
  MaterialCreateForm,
  MaterialDeleteButton,
  MaterialUploadForm,
} from "@/features/admin-catalog/ui/forms";
import { requireWorkspacePermission } from "@/features/auth/page-access";
import { catalogIdSchema } from "@/features/admin-catalog/validation";
import { AdminPageHeader } from "@/components/admin-page-header";
import {
  adminBackLink,
  adminCard,
  adminDangerZone,
  adminSecondaryButton,
} from "@/components/admin-styles";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireWorkspacePermission("material.manage");
  const parsed = catalogIdSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  let material: Awaited<ReturnType<typeof getMaterial>>;
  try {
    material = await getMaterial(parsed.data);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  return (
    <WorkspaceShell
      admin
      name={auth.user.name}
      email={auth.user.email}
      permissions={auth.permissions}
      section="materials"
    >
      <Link className={adminBackLink} href="/admin/materials">
        ← Store &amp; materials
      </Link>
      <AdminPageHeader
        kicker="EDIT STORE RESOURCE"
        title={material.title}
        description="Update its organisation and source without publishing it to students."
      >
        <span className="rounded-full bg-[#fff0e8] px-3 py-2 text-xs font-bold text-prep-orange-dark">
          Stored only · not live
        </span>
      </AdminPageHeader>
      <div className="grid grid-cols-[15rem_minmax(0,1fr)] items-start gap-4 max-[760px]:grid-cols-1">
        <aside
          className={`${adminCard} sticky top-[5.5rem] grid gap-[.8rem] p-5 max-[760px]:static`}
        >
          <span
            className="grid size-12 place-items-center rounded-lg bg-[#fff0e8] text-prep-orange not-italic"
            aria-hidden="true"
          >
            {material.type === "VIDEO" ? "▶" : "▤"}
          </span>
          <h2 className="m-0 text-base font-bold">Resource details</h2>
          <dl className="m-0 grid gap-0">
            <div className="flex justify-between gap-4 border-t border-[#ebe9e6] py-2 text-[.7rem]">
              <dt>Type</dt>
              <dd className="m-0 text-right font-bold">{material.type}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-[#ebe9e6] py-2 text-[.7rem]">
              <dt>Version</dt>
              <dd className="m-0 text-right font-bold">
                {material.latestVersion?.version ?? 1}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-[#ebe9e6] py-2 text-[.7rem]">
              <dt>Subject</dt>
              <dd className="m-0 text-right font-bold">{material.subject}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-[#ebe9e6] py-2 text-[.7rem]">
              <dt>Topic</dt>
              <dd className="m-0 text-right font-bold">{material.topic}</dd>
            </div>
          </dl>
          {material.latestVersion?.privateObjectKey && (
            <a
              className={adminSecondaryButton}
              href={`/api/admin/catalog/materials/${material.id}/preview`}
              target="_blank"
              rel="noreferrer"
            >
              Preview current file
            </a>
          )}
        </aside>
        <section className={`${adminCard} p-5`}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <span className="eyebrow">RESOURCE SETTINGS</span>
              <h2 className="mt-1 text-base font-bold">
                {material.type === "VIDEO"
                  ? "Video details"
                  : "File and details"}
              </h2>
            </div>
          </div>
          {material.type === "PDF" || material.type === "FILE" ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-4 rounded-[.65rem] bg-prep-canvas p-4 max-[760px]:flex-col max-[760px]:items-start">
                <strong>
                  {material.latestVersion?.originalFileName ??
                    "No file uploaded"}
                </strong>
                <span className="text-[.8rem] text-prep-muted">
                  {material.latestVersion?.sizeBytes
                    ? `${(material.latestVersion.sizeBytes / 1024 / 1024).toFixed(2)} MB`
                    : "Upload required"}
                </span>
                <span className="text-[.8rem] text-prep-muted">
                  Version {material.latestVersion?.version ?? 0}
                </span>
              </div>
              <MaterialUploadForm material={material} />
            </>
          ) : (
            <MaterialCreateForm material={material} />
          )}
        </section>
      </div>
      <div className={adminDangerZone}>
        <div>
          <strong>Delete resource</strong>
          <span>Only possible when it is not linked to a package.</span>
        </div>
        <MaterialDeleteButton id={material.id} />
      </div>
    </WorkspaceShell>
  );
}
