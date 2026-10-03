"use client";
import {
  ContentPicker,
  SearchableContentSelect,
  type SellableItems,
} from "./content-picker";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Field } from "@/features/auth/ui/field";
import type { ApiFailure, ApiSuccess } from "@/lib/http/api-response";

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
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
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
      await mutate("cover", () => upload(`products/${result.id}/cover`, coverBody));
    }
    if (result) router.push(`/admin/packages/${result.id}`);
  }
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  return (
    <form className="admin-form product-create-form" onSubmit={submit}>
      <fieldset disabled={Boolean(busy)}>
        <div className="product-form-top">
          <div className="product-form-fields">
            <Field id="product-name" label="Package title" name="name" defaultValue={product?.name} required />
            <label className="field">
              <span>Short description</span>
              <textarea name="description" defaultValue={product?.description ?? ""} maxLength={4000} rows={4} required />
            </label>
          </div>
          <label className="cover-upload-field">
            <span>Cover image</span>
            <span className="cover-preview">
              {coverPreview ? <Image src={coverPreview} alt="Selected package cover preview" fill sizes="224px" unoptimized /> : product?.coverObjectKey ? <Image src={`/api/catalog/products/${product.id}/cover`} alt={`${product.name} cover`} fill sizes="224px" /> : <b>Upload package cover</b>}
            </span>
            <input name="cover" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.currentTarget.files?.[0]; setCoverPreview(file ? URL.createObjectURL(file) : null); }} />
            <small>JPG, PNG or WebP · up to 5 MB</small>
          </label>
        </div>
        <div className="product-pricing-grid">
          <Field id="product-mrp" label="MRP (₹)" name="mrpRupees" defaultValue={product ? (product.mrpPaise ?? product.pricePaise) / 100 : undefined} type="number" min={0} step="0.01" required />
          <Field id="product-price" label="Selling price (₹)" name="priceRupees" defaultValue={product ? product.pricePaise / 100 : undefined} type="number" min={0} step="0.01" required />
          <label className="field"><span>Language</span><select name="language" defaultValue={product?.language ?? "BILINGUAL"}><option value="ENGLISH">English</option><option value="HINDI">Hindi</option><option value="BILINGUAL">Bilingual</option></select></label>
          <Field id="product-days" label="Access days" name="accessDays" type="number" min={1} max={3650} defaultValue={product?.accessDays ?? 365} required />
        </div>
        {!product && items && <ContentPicker items={items} />}
        <label className="field"><span>Syllabus (optional)</span><textarea name="syllabus" defaultValue={product?.syllabus ?? ""} maxLength={12000} rows={4} placeholder="Add topics or sections included in this package" /></label>
        <div className="dialog-form-footer"><button className="button" type="submit">{busy ? "Saving…" : product ? "Save package" : "Create product"}</button></div>
      </fieldset>
      {error && (
        <p className="notice danger" role="alert">
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
    subject:string;
    topic:string;
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
          subject:String(data.get("subject")),
          topic:String(data.get("topic")),
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
    <form className="admin-form" onSubmit={submit}>
      <fieldset disabled={Boolean(busy)}>
        <Field
          id="material-title"
          label="Material title"
          name="title"
          defaultValue={material?.title}
          required
        />
        <div className="question-grid"><Field id="material-subject" label="Subject" name="subject" defaultValue={material?.subject??"General"} required/><Field id="material-topic" label="Topic" name="topic" defaultValue={material?.topic??"General"} required/></div>
        <label className="field">
          <span>HTTPS video URL</span>
          <textarea name="body" defaultValue={material?.body ?? ""} rows={4} />
        </label>
        <button className="button" type="submit">
          {busy ? "Saving…" : material ? "Save material" : "Save video"}
        </button>
      </fieldset>
      {error && (
        <p className="notice danger" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export function MaterialCreateWorkspace() {
  const [kind, setKind] = useState<"FILE" | "VIDEO">("FILE");
  return (
    <div className="material-workspace-form">
      <ol className="workspace-steps" aria-label="Material creation steps">
        <li className="active"><b>1</b><span><strong>Resource type</strong><small>Choose file or video</small></span></li>
        <li className="active"><b>2</b><span><strong>Details</strong><small>Name and organise</small></span></li>
        <li><b>3</b><span><strong>Save to store</strong><small>Use later in packages</small></span></li>
      </ol>
      <section className="resource-type-picker" aria-label="Resource type">
        <button type="button" className={kind === "FILE" ? "active" : ""} onClick={() => setKind("FILE")} aria-pressed={kind === "FILE"}>
          <i aria-hidden="true">▤</i><span><strong>PDF or study file</strong><small>PDF, notes, slides, ZIP or document</small></span>
        </button>
        <button type="button" className={kind === "VIDEO" ? "active" : ""} onClick={() => setKind("VIDEO")} aria-pressed={kind === "VIDEO"}>
          <i aria-hidden="true">▶</i><span><strong>Video resource</strong><small>Save a secure HTTPS video link</small></span>
        </button>
      </section>
      <div className="material-form-surface">
        <header><div><span className="eyebrow">STORE RESOURCE</span><h3>{kind === "FILE" ? "Upload study material" : "Add video material"}</h3></div><span className="store-only-badge">Stored only · not live</span></header>
        {kind === "FILE" ? <MaterialUploadForm /> : <MaterialCreateForm />}
      </div>
      <p className="material-workspace-note">Saving here never publishes this resource. It becomes available to select inside Product Package Builder.</p>
    </div>
  );
}

export function MaterialUploadForm({
  material,
}: {
  material?: { id: string; title: string; allowDownload: boolean;subject?:string;topic?:string };
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
    <form className="admin-form material-upload-form" onSubmit={submit}>
      <fieldset disabled={Boolean(busy)}>
        <Field
          id={material ? "replacement-title" : "upload-title"}
          label="Material title"
          name="title"
          defaultValue={material?.title}
          required
        />
        <div className="question-grid"><Field id="upload-subject" label="Subject" name="subject" defaultValue={material?.subject??"General"} required/><Field id="upload-topic" label="Topic" name="topic" defaultValue={material?.topic??"General"} required/></div>
        <label className="field">
          <span>Study file</span>
          <input
            name="file"
            type="file"
            accept=".pdf,.zip,.txt,.docx,.pptx,application/pdf"
            required
          />
          <small>PDF, ZIP, TXT, DOCX or PPTX. The file stays private.</small>
        </label>
        <label className="check-row">
          <input
            name="allowDownload"
            type="checkbox"
            defaultChecked={material?.allowDownload}
          />
          Allow students to download their watermarked copy (PDF) or protected
          file
        </label>
        <button className="button" type="submit">
          {busy
            ? "Uploading…"
            : material
              ? "Upload new version"
              : "Save material"}
        </button>
      </fieldset>
      {error && (
        <p className="notice danger" role="alert">
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
    <div className="bundle-controls">
      <section className="panel">
        <span className="eyebrow">PACKAGE CONTENTS</span>
        <h2>Linked access</h2>
        {linkedTests.map((item) => (
          <div className="bundle-item" key={item.id}>
            <span>TEST</span>
            <strong>{item.title}</strong>
            <small>{item.mode}</small>
            <button
                type="button"
                className="text-button"
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
          <div className="bundle-item" key={item.id}>
            <span>MATERIAL</span>
            <strong>{item.title}</strong>
            <small>{item.type}</small>
            <button
                type="button"
                className="text-button"
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
          <p className="muted">Nothing linked yet.</p>
        )}
      </section>
        <>
          <section className="panel">
            <h2>Add test</h2>
            {tests.length ? (
              <form
                className="inline-admin-form"
                onSubmit={(event) => link(event, "TEST")}
              >
                <fieldset disabled={Boolean(busy)}>
                  <SearchableContentSelect items={tests} label="Test" />
                  <button className="button secondary" type="submit">
                    Link test
                  </button>
                </fieldset>
              </form>
            ) : (
              <p className="muted">No other tests available.</p>
            )}
          </section>
          <section className="panel">
            <h2>Add study material</h2>
            {materials.length ? (
              <form
                className="inline-admin-form"
                onSubmit={(event) => link(event, "MATERIAL")}
              >
                <fieldset disabled={Boolean(busy)}>
                  <SearchableContentSelect items={materials} label="Material" />
                  <button className="button secondary" type="submit">
                    Link material
                  </button>
                </fieldset>
              </form>
            ) : (
              <p className="muted">No other materials available.</p>
            )}
          </section>
          <button
            type="button"
            className={isLive ? "button secondary" : "button"}
            disabled={Boolean(busy)}
            onClick={() => mutate("visibility", () => request(`products/${id}/status`, { isLive: !isLive }, "PATCH"))}
          >
            {busy === "visibility" ? "Updating…" : isLive ? "Take product offline" : "Make product live"}
          </button>
        </>
      {error && (
        <p className="notice danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function ProductVisibilityToggle({ id, isLive }: { id: string; isLive: boolean }) {
  const { busy, error, mutate } = useMutation();
  return <div className="visibility-control">
    <button type="button" role="switch" aria-checked={isLive} className={isLive ? "availability-toggle on" : "availability-toggle"} disabled={Boolean(busy)} onClick={() => mutate("visibility", () => request(`products/${id}/status`, { isLive: !isLive }, "PATCH"))}>
      <i aria-hidden="true"/><span>{busy ? "Updating…" : isLive ? "Available for students" : "Not available"}</span>
    </button>
    {error ? <small className="danger-text" role="alert">{error}</small> : null}
  </div>;
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
    <div className="form-actions">
      <button
          type="button"
          className="button secondary"
          disabled={Boolean(busy)}
          onClick={duplicate}
        >
          Create editable copy
        </button>
      {error && (
        <p className="notice danger" role="alert">
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
    const result = await mutate("delete", () => request(`materials/${id}`, {}, "DELETE"));
    if (result) router.push("/admin/materials");
  }
  return (
    <div className="danger-zone">
      <button className="button danger" type="button" disabled={Boolean(busy)} onClick={remove}>{busy ? "Deleting…" : "Delete material"}</button>
      {error && <p className="notice danger" role="alert">{error}</p>}
    </div>
  );
}
