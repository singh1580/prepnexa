"use client";
import {
  ContentPicker,
  SearchableContentSelect,
  type SellableItems,
} from "./content-picker";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ProductCoverImage } from "@/components/product-cover-image";
import { Field } from "@/features/auth/ui/field";
import type { ApiFailure, ApiSuccess } from "@/lib/http/api-response";
import { UiIcon } from "@/components/ui-icon";
import {
  adminControl,
  adminDangerButton,
  adminDangerNotice,
  adminPrimaryButton,
  adminSecondaryButton,
} from "@/components/admin-styles";

const adminField = "grid gap-[0.38rem] text-[0.76rem] font-bold text-[#596168]";
const adminTextarea =
  "w-full min-w-0 resize-y rounded-[0.45rem] border border-[#cacac5] bg-white p-[0.8rem] font-normal outline-none focus:border-prep-orange focus:ring-2 focus:ring-[#ffdfd2]";
const adminError =
  "mt-3 rounded-prep-control border border-[#efc1bd] bg-[#fdebea] p-3 text-sm text-[#ad3028]";
const materialStepClass = (active: boolean) =>
  active
    ? "text-prep-orange-dark [&>b]:bg-prep-orange [&>b]:text-white [&_strong]:text-prep-ink"
    : "text-prep-muted [&>b]:bg-[#ecebea] [&_strong]:text-prep-ink";
const resourceTypeClass = (active: boolean) =>
  active
    ? "border-prep-orange bg-[#fff8f3] ring-2 ring-[#ffdfd2]"
    : "border-prep-line bg-white";

type LinkOption = {
  id: string;
  title: string;
  examName?: string;
  mode?: string;
  type?: string;
};
async function request<T>(
  path: string,
  body: Record<string, unknown>,
  method: "POST" | "PATCH" | "DELETE" = "POST",
) {
  const response = await fetch(`/api/admin/catalog/${path}`, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as ApiSuccess<T> | ApiFailure;
  if (!response.ok || "error" in payload)
    throw new Error(
      "error" in payload
        ? payload.error.message
        : "Couldn't complete this request.",
    );
  return payload.data;
}
async function upload<T>(path: string, body: FormData) {
  const response = await fetch(`/api/admin/catalog/${path}`, {
    method: "POST",
    credentials: "same-origin",
    body,
  });
  const payload = (await response.json()) as ApiSuccess<T> | ApiFailure;
  if (!response.ok || "error" in payload)
    throw new Error(
      "error" in payload ? payload.error.message : "Couldn't upload this file.",
    );
  return payload.data;
}
function useMutation() {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function mutate<T>(key: string, operation: () => Promise<T>) {
    setBusy(key);
    setError("");
    try {
      const result = await operation();
      router.refresh();
      return result;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Couldn't save this change.",
      );
      return undefined;
    } finally {
      setBusy("");
    }
  }
  return { router, busy, error, mutate };
}

export function ProductCreateForm({
  product,
  items,
}: {
  items?: SellableItems;
  product?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    syllabus: string | null;
    language: string;
    coverObjectKey: string | null;
    mrpPaise: number | null;
    pricePaise: number;
    accessDays: number;
  };
} = {}) {
  const { router, busy, error, mutate } = useMutation();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverName, setCoverName] = useState("");
  useEffect(
    () => () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    },
    [coverPreview],
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const mrpInput = form.elements.namedItem(
      "mrpRupees",
    ) as HTMLInputElement | null;
    const priceInput = form.elements.namedItem(
      "priceRupees",
    ) as HTMLInputElement | null;
    mrpInput?.setCustomValidity("");
    if (
      mrpInput &&
      priceInput &&
      Number(mrpInput.value) < Number(priceInput.value)
    ) {
      mrpInput.setCustomValidity(
        "MRP must be equal to or higher than the selling price.",
      );
      mrpInput.reportValidity();
      return;
    }
    const result = await mutate<{ id: string }>("product", () =>
      request(
        product ? `products/${product.id}` : "products",
        {
          name: String(data.get("name")),
          slug: product?.slug ?? "",
          description: String(data.get("description") ?? ""),
          syllabus: String(data.get("syllabus") ?? ""),
          language: String(data.get("language") ?? "BILINGUAL"),
          mrpPaise: Math.round(Number(data.get("mrpRupees")) * 100),
          pricePaise: Math.round(Number(data.get("priceRupees")) * 100),
          accessDays: Number(data.get("accessDays")),
          ...(!product
            ? {
                testIds: data.getAll("testIds"),
                materialIds: data.getAll("materialIds"),
              }
            : {}),
        },
        product ? "PATCH" : "POST",
      ),
    );
    const cover = data.get("cover");
    if (result && cover instanceof File && cover.size > 0) {
      const coverBody = new FormData();
      coverBody.set("file", cover);
      await mutate("cover", () =>
        upload(`products/${result.id}/cover`, coverBody),
      );
    }
    if (result) router.push(`/admin/packages/${result.id}`);
  }
  return (
    <form onSubmit={submit}>
      <fieldset className="grid gap-4 border-0 p-0" disabled={Boolean(busy)}>
        <div className="grid grid-cols-[minmax(0,1fr)_14rem] gap-4 max-[650px]:grid-cols-1">
          <div className="grid gap-4">
            <Field
              id="product-name"
              label="Package title"
              name="name"
              defaultValue={product?.name}
              required
            />
            <label className={adminField}>
              <span>Short description</span>
              <textarea
                className={adminTextarea}
                name="description"
                defaultValue={product?.description ?? ""}
                maxLength={4000}
                rows={4}
                required
              />
            </label>
          </div>
          <label className="grid content-start gap-[0.45rem] text-[0.85rem] font-bold max-[650px]:order-first">
            <span>Cover image</span>
            <span className="relative grid h-[9.5rem] place-items-center overflow-hidden rounded-[0.65rem] border border-dashed border-[#c9c1b8] bg-[#f4eee8] text-center text-[#9f3c1c] max-[650px]:h-44 [&_img]:object-cover">
              {coverPreview ? (
                <Image
                  src={coverPreview}
                  alt="Selected package cover preview"
                  fill
                  sizes="224px"
                  unoptimized
                />
              ) : product?.coverObjectKey ? (
                <ProductCoverImage
                  productId={product.id}
                  alt={`${product.name} cover`}
                  sizes="224px"
                  fallback={<b>Upload package cover</b>}
                />
              ) : (
                <b>Upload package cover</b>
              )}
            </span>
            <input
              className="w-full overflow-hidden rounded-[0.45rem] border border-[#ddd9d5] bg-[#faf9f7] p-[0.35rem] text-[0.74rem] text-[#656c72] file:mr-[0.65rem] file:cursor-pointer file:rounded-[0.35rem] file:border-0 file:bg-[#fff0e8] file:px-[0.7rem] file:py-2 file:font-bold file:text-prep-orange-dark"
              ref={coverInputRef}
              name="cover"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                setCoverPreview(file ? URL.createObjectURL(file) : null);
                setCoverName(file?.name ?? "");
              }}
            />
            <small>{coverName || "JPG, PNG or WebP · up to 5 MB"}</small>
            {coverPreview ? (
              <button
                className="mt-[0.15rem] inline-flex items-center justify-center gap-[0.4rem] border-0 bg-transparent text-[0.75rem] font-bold text-[#b42318] [&_svg]:size-4"
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  if (coverInputRef.current) coverInputRef.current.value = "";
                  setCoverPreview(null);
                  setCoverName("");
                }}
              >
                <UiIcon name="trash" /> Remove selected image
              </button>
            ) : null}
          </label>
        </div>
        <div className="grid grid-cols-4 gap-[0.8rem] max-[1000px]:grid-cols-2 max-[650px]:grid-cols-1">
          <Field
            id="product-mrp"
            label="MRP (₹)"
            name="mrpRupees"
            defaultValue={
              product
                ? (product.mrpPaise ?? product.pricePaise) / 100
                : undefined
            }
            type="number"
            min={0}
            step="0.01"
            required
          />
          <Field
            id="product-price"
            label="Selling price (₹)"
            name="priceRupees"
            defaultValue={product ? product.pricePaise / 100 : undefined}
            type="number"
            min={0}
            step="0.01"
            required
          />
          <label className={adminField}>
            <span>Language</span>
            <select
              className={adminControl}
              name="language"
              defaultValue={product?.language ?? "BILINGUAL"}
            >
              <option value="ENGLISH">English</option>
              <option value="HINDI">Hindi</option>
              <option value="BILINGUAL">Bilingual</option>
            </select>
          </label>
          <Field
            id="product-days"
            label="Access days"
            name="accessDays"
            type="number"
            min={1}
            max={3650}
            defaultValue={product?.accessDays ?? 365}
            required
          />
        </div>
        {!product && items && <ContentPicker items={items} />}
        <label className={adminField}>
          <span>Syllabus (optional)</span>
          <textarea
            className={adminTextarea}
            name="syllabus"
            defaultValue={product?.syllabus ?? ""}
            maxLength={12000}
            rows={4}
            placeholder="Add topics or sections included in this package"
          />
        </label>
        <div className="flex justify-end border-t border-prep-line pt-4">
          <button className={adminPrimaryButton} type="submit">
            {busy ? "Saving…" : product ? "Save package" : "Create product"}
          </button>
        </div>
      </fieldset>
      {error && (
        <p className={adminError} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export function MaterialCreateForm({
  material,
}: {
  material?: {
    id: string;
    title: string;
    subject: string;
    topic: string;
    type: string;
    body: string | null;
    privateObjectKey: string | null;
    allowDownload: boolean;
  };
}) {
  const { busy, error, mutate } = useMutation();
  const type = "VIDEO";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await mutate("material", () =>
      request(
        material ? `materials/${material.id}` : "materials",
        {
          title: String(data.get("title")),
          subject: String(data.get("subject")),
          topic: String(data.get("topic")),
          type,
          body: String(data.get("body") ?? ""),
          privateObjectKey: "",
          allowDownload: false,
        },
        material ? "PATCH" : "POST",
      ),
    );
    if (result && !material) form.reset();
  }
  return (
    <form onSubmit={submit}>
      <fieldset className="grid gap-4 border-0 p-0" disabled={Boolean(busy)}>
        <Field
          id="material-title"
          label="Material title"
          name="title"
          defaultValue={material?.title}
          required
        />
        <div className="grid grid-cols-2 gap-4 max-[650px]:grid-cols-1">
          <Field
            id="material-subject"
            label="Subject"
            name="subject"
            defaultValue={material?.subject ?? "General"}
            required
          />
          <Field
            id="material-topic"
            label="Topic"
            name="topic"
            defaultValue={material?.topic ?? "General"}
            required
          />
        </div>
        <label className={adminField}>
          <span>HTTPS video URL</span>
          <textarea
            className={adminTextarea}
            name="body"
            defaultValue={material?.body ?? ""}
            rows={4}
          />
        </label>
        <button className={adminPrimaryButton} type="submit">
          {busy ? "Saving…" : material ? "Save material" : "Save video"}
        </button>
      </fieldset>
      {error && (
        <p className={adminError} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export function MaterialCreateWorkspace() {
  const [kind, setKind] = useState<"FILE" | "VIDEO">("FILE");
  return (
    <div className="grid gap-4">
      <ol
        className="flex list-none overflow-x-auto rounded-prep-control border border-prep-line bg-white p-0 text-[0.7rem] [&_li]:flex [&_li]:min-w-44 [&_li]:items-center [&_li]:gap-2 [&_li]:p-3 [&_li+li]:border-l [&_li+li]:border-prep-line [&_li>b]:grid [&_li>b]:size-6 [&_li>b]:shrink-0 [&_li>b]:place-items-center [&_li>b]:rounded-full [&_li>b]:text-[0.65rem] [&_li>span]:grid [&_li_small]:text-[0.62rem]"
        aria-label="Material creation steps"
      >
        <li className={materialStepClass(true)}>
          <b>1</b>
          <span>
            <strong>Resource type</strong>
            <small>Choose file or video</small>
          </span>
        </li>
        <li className={materialStepClass(true)}>
          <b>2</b>
          <span>
            <strong>Details</strong>
            <small>Name and organise</small>
          </span>
        </li>
        <li className={materialStepClass(false)}>
          <b>3</b>
          <span>
            <strong>Save to store</strong>
            <small>Use later in packages</small>
          </span>
        </li>
      </ol>
      <section
        className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1 [&_button]:grid [&_button]:grid-cols-[2.5rem_1fr] [&_button]:items-center [&_button]:gap-3 [&_button]:rounded-[0.65rem] [&_button]:border [&_button]:p-4 [&_button]:text-left [&_button]:hover:border-prep-orange [&_button_i]:grid [&_button_i]:size-10 [&_button_i]:place-items-center [&_button_i]:rounded-[0.55rem] [&_button_i]:bg-[#fff0e8] [&_button_i]:not-italic [&_button_i]:text-prep-orange-dark [&_button_span]:grid [&_button_small]:text-[0.68rem] [&_button_small]:text-prep-muted [&_button_strong]:text-[0.82rem]"
        aria-label="Resource type"
      >
        <button
          type="button"
          className={resourceTypeClass(kind === "FILE")}
          onClick={() => setKind("FILE")}
          aria-pressed={kind === "FILE"}
        >
          <i aria-hidden="true">▤</i>
          <span>
            <strong>PDF or study file</strong>
            <small>PDF, notes, slides, ZIP or document</small>
          </span>
        </button>
        <button
          type="button"
          className={resourceTypeClass(kind === "VIDEO")}
          onClick={() => setKind("VIDEO")}
          aria-pressed={kind === "VIDEO"}
        >
          <i aria-hidden="true">▶</i>
          <span>
            <strong>Video resource</strong>
            <small>Save a secure HTTPS video link</small>
          </span>
        </button>
      </section>
      <div className="overflow-hidden rounded-[0.7rem] border border-prep-line bg-white">
        <header className="flex items-start justify-between gap-4 border-b border-prep-line px-5 py-4 max-[600px]:flex-col">
          <div>
            <span className="eyebrow">STORE RESOURCE</span>
            <h3>
              {kind === "FILE" ? "Upload study material" : "Add video material"}
            </h3>
          </div>
          <span className="rounded-full bg-[#eef2fb] px-3 py-1 text-[0.68rem] font-bold text-[#46649a]">
            Stored only · not live
          </span>
        </header>
        <div className="p-5 max-[600px]:p-4">
          {kind === "FILE" ? <MaterialUploadForm /> : <MaterialCreateForm />}
        </div>
      </div>
      <p className="m-0 text-[0.72rem] leading-relaxed text-prep-muted">
        Saving here never publishes this resource. It becomes available to
        select inside Product Package Builder.
      </p>
    </div>
  );
}

export function MaterialUploadForm({
  material,
}: {
  material?: {
    id: string;
    title: string;
    allowDownload: boolean;
    subject?: string;
    topic?: string;
  };
}) {
  const { router, busy, error, mutate } = useMutation();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("allowDownload", data.get("allowDownload") ? "true" : "false");
    const result = await mutate<{ id: string }>("upload", () =>
      upload(
        material ? `materials/${material.id}/upload` : "materials/upload",
        data,
      ),
    );
    if (result) {
      if (material) router.refresh();
      else router.push(`/admin/materials/${result.id}`);
    }
  }
  return (
    <form onSubmit={submit}>
      <fieldset className="grid gap-4 border-0 p-0" disabled={Boolean(busy)}>
        <Field
          id={material ? "replacement-title" : "upload-title"}
          label="Material title"
          name="title"
          defaultValue={material?.title}
          required
        />
        <div className="grid grid-cols-2 gap-4 max-[650px]:grid-cols-1">
          <Field
            id="upload-subject"
            label="Subject"
            name="subject"
            defaultValue={material?.subject ?? "General"}
            required
          />
          <Field
            id="upload-topic"
            label="Topic"
            name="topic"
            defaultValue={material?.topic ?? "General"}
            required
          />
        </div>
        <label className={adminField}>
          <span>Study file</span>
          <input
            className="w-full overflow-hidden rounded-[0.45rem] border border-dashed border-[#93a9b9] bg-[#faf9f7] p-[0.65rem] text-[0.74rem] file:mr-[0.65rem] file:cursor-pointer file:rounded-[0.35rem] file:border-0 file:bg-[#fff0e8] file:px-[0.7rem] file:py-2 file:font-bold file:text-prep-orange-dark"
            name="file"
            type="file"
            accept=".pdf,.zip,.txt,.docx,.pptx,application/pdf"
            required
          />
          <small className="font-normal text-prep-muted">
            PDF, ZIP, TXT, DOCX or PPTX. The file stays private.
          </small>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-[0.76rem] font-semibold [&_input]:mt-0.5 [&_input]:accent-prep-orange">
          <input
            name="allowDownload"
            type="checkbox"
            defaultChecked={material?.allowDownload}
          />
          Allow students to download their watermarked copy (PDF) or protected
          file
        </label>
        <button className={adminPrimaryButton} type="submit">
          {busy
            ? "Uploading…"
            : material
              ? "Upload new version"
              : "Save material"}
        </button>
      </fieldset>
      {error && (
        <p className={adminError} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export function ProductBundleControls({
  id,
  isLive,
  linkedTests,
  linkedMaterials,
  availableTests,
  availableMaterials,
}: {
  id: string;
  isLive: boolean;
  linkedTests: LinkOption[];
  linkedMaterials: LinkOption[];
  availableTests: LinkOption[];
  availableMaterials: LinkOption[];
}) {
  const { busy, error, mutate } = useMutation();
  const linked = new Set(
    [...linkedTests, ...linkedMaterials].map((item) => item.id),
  );
  const tests = availableTests.filter((item) => !linked.has(item.id));
  const materials = availableMaterials.filter((item) => !linked.has(item.id));
  async function link(
    event: FormEvent<HTMLFormElement>,
    kind: "TEST" | "MATERIAL",
  ) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await mutate(kind, () =>
      request(`products/${id}/links`, { kind, id: String(data.get("id")) }),
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 max-[900px]:grid-cols-1 [&>button]:col-span-full [&>.bundle-error]:col-span-full">
      <section className="col-span-full rounded-[0.65rem] border border-prep-line bg-white p-[1.15rem]">
        <span className="eyebrow">PACKAGE CONTENTS</span>
        <h2>Linked access</h2>
        {linkedTests.map((item) => (
          <div
            className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-[0.55rem] border-t border-prep-line py-3 max-[560px]:grid-cols-[auto_minmax(0,1fr)_auto]"
            key={item.id}
          >
            <span className="text-[0.65rem] font-extrabold text-prep-orange-dark">
              TEST
            </span>
            <strong className="min-w-0 truncate">{item.title}</strong>
            <small className="whitespace-nowrap text-prep-muted max-[560px]:col-start-2">
              {item.mode}
            </small>
            <button
              type="button"
              className="border-0 bg-transparent px-1 py-2 text-[0.72rem] font-bold text-prep-orange-dark max-[560px]:col-start-3 max-[560px]:row-span-2 max-[560px]:row-start-1"
              disabled={Boolean(busy)}
              onClick={() =>
                mutate("unlink", () =>
                  request(
                    `products/${id}/links`,
                    { kind: "TEST", id: item.id },
                    "DELETE",
                  ),
                )
              }
            >
              Remove
            </button>
          </div>
        ))}
        {linkedMaterials.map((item) => (
          <div
            className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-[0.55rem] border-t border-prep-line py-3 max-[560px]:grid-cols-[auto_minmax(0,1fr)_auto]"
            key={item.id}
          >
            <span className="text-[0.65rem] font-extrabold text-prep-orange-dark">
              MATERIAL
            </span>
            <strong className="min-w-0 truncate">{item.title}</strong>
            <small className="whitespace-nowrap text-prep-muted max-[560px]:col-start-2">
              {item.type}
            </small>
            <button
              type="button"
              className="border-0 bg-transparent px-1 py-2 text-[0.72rem] font-bold text-prep-orange-dark max-[560px]:col-start-3 max-[560px]:row-span-2 max-[560px]:row-start-1"
              disabled={Boolean(busy)}
              onClick={() =>
                mutate("unlink", () =>
                  request(
                    `products/${id}/links`,
                    { kind: "MATERIAL", id: item.id },
                    "DELETE",
                  ),
                )
              }
            >
              Remove
            </button>
          </div>
        ))}
        {!linkedTests.length && !linkedMaterials.length && (
          <p className="text-sm text-prep-muted">Nothing linked yet.</p>
        )}
      </section>
      <>
        <section className="rounded-[0.65rem] border border-prep-line bg-white p-[1.15rem]">
          <h2>Add test</h2>
          {tests.length ? (
            <form className="mt-4" onSubmit={(event) => link(event, "TEST")}>
              <fieldset
                className="grid gap-3 border-0 p-0"
                disabled={Boolean(busy)}
              >
                <SearchableContentSelect items={tests} label="Test" />
                <button className={adminSecondaryButton} type="submit">
                  Link test
                </button>
              </fieldset>
            </form>
          ) : (
            <p className="text-sm text-prep-muted">No other tests available.</p>
          )}
        </section>
        <section className="rounded-[0.65rem] border border-prep-line bg-white p-[1.15rem]">
          <h2>Add study material</h2>
          {materials.length ? (
            <form
              className="mt-4"
              onSubmit={(event) => link(event, "MATERIAL")}
            >
              <fieldset
                className="grid gap-3 border-0 p-0"
                disabled={Boolean(busy)}
              >
                <SearchableContentSelect items={materials} label="Material" />
                <button className={adminSecondaryButton} type="submit">
                  Link material
                </button>
              </fieldset>
            </form>
          ) : (
            <p className="text-sm text-prep-muted">
              No other materials available.
            </p>
          )}
        </section>
        <button
          type="button"
          className={isLive ? adminSecondaryButton : adminPrimaryButton}
          disabled={Boolean(busy)}
          onClick={() =>
            mutate("visibility", () =>
              request(`products/${id}/status`, { isLive: !isLive }, "PATCH"),
            )
          }
        >
          {busy === "visibility"
            ? "Updating…"
            : isLive
              ? "Take product offline"
              : "Make product live"}
        </button>
      </>
      {error && (
        <p className={`${adminError} bundle-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function ProductVisibilityToggle({
  id,
  isLive,
}: {
  id: string;
  isLive: boolean;
}) {
  const { busy, error, mutate } = useMutation();
  return (
    <div className="grid justify-items-end gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={isLive}
        className="flex cursor-pointer items-center gap-2 border-0 bg-transparent text-[0.68rem] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        disabled={Boolean(busy)}
        onClick={() =>
          mutate("visibility", () =>
            request(`products/${id}/status`, { isLive: !isLive }, "PATCH"),
          )
        }
      >
        <i
          className={`relative h-[1.05rem] w-8 rounded-full transition-colors after:absolute after:top-[0.15rem] after:left-[0.15rem] after:size-3 after:rounded-full after:bg-white after:transition-transform after:content-[''] ${isLive ? "bg-[#22a861] after:translate-x-[0.95rem]" : "bg-[#a8adb1]"}`}
          aria-hidden="true"
        />
        <span>
          {busy
            ? "Updating…"
            : isLive
              ? "Available for students"
              : "Not available"}
        </span>
      </button>
      {error ? (
        <small className="text-[0.65rem] text-[#ad3028]" role="alert">
          {error}
        </small>
      ) : null}
    </div>
  );
}

export function CatalogActions({
  id,
  kind,
}: {
  id: string;
  kind: "materials" | "products";
}) {
  const { router, busy, error, mutate } = useMutation();
  async function duplicate() {
    const result = await mutate<{ id: string }>("copy", () =>
      request(`${kind}/${id}/duplicate`, {}),
    );
    if (result)
      router.push(
        `/admin/${kind === "materials" ? "materials" : "packages"}/${result.id}`,
      );
  }
  return (
    <div className="flex flex-wrap gap-[0.7rem]">
      <button
        type="button"
        className={adminSecondaryButton}
        disabled={Boolean(busy)}
        onClick={duplicate}
      >
        Create editable copy
      </button>
      {error && (
        <p
          className="rounded-prep-control border border-[#efc1bd] bg-[#fdebea] p-3 text-sm text-[#ad3028]"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function MaterialDeleteButton({ id }: { id: string }) {
  const { router, busy, error, mutate } = useMutation();
  async function remove() {
    if (!window.confirm("Delete this saved material permanently?")) return;
    const result = await mutate("delete", () =>
      request(`materials/${id}`, {}, "DELETE"),
    );
    if (result) router.push("/admin/materials");
  }
  return (
    <div className="grid justify-items-end gap-2 max-[700px]:justify-items-stretch">
      <button
        className={adminDangerButton}
        type="button"
        disabled={Boolean(busy)}
        onClick={remove}
      >
        <UiIcon name="trash" />
        {busy ? "Deleting…" : "Delete material"}
      </button>
      {error && (
        <p className={`${adminDangerNotice} max-w-96`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
