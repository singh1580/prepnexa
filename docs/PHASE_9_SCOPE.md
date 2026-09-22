# Phase 9 — protected study materials

Phase 9 turns the existing material metadata into a complete private-file workflow while preserving the two-workspace product: one Admin workspace and one Student workspace.

## Admin flow

1. Admin chooses an exam, title and PDF/study file. Object keys are never typed manually.
2. The server validates the allowed MIME type, file size and PDF signature, calculates SHA-256 and writes the file to private storage.
3. Database metadata is saved only after storage succeeds. A failed database mutation removes the newly uploaded object.
4. Replacing a draft file creates an immutable new material version; published material is changed through an editable copy.
5. PDF/file material cannot publish without complete latest-version metadata. Published materials can be attached to standalone products or mixed bundles through the existing package builder.

Accepted files are PDF, ZIP, TXT, DOCX and PPTX. The default limit is 25 MB and is configurable up to 100 MB.

## Student flow

- `My library` lists published materials from zero-price published products or an active, unexpired entitlement.
- The material detail page supports articles, HTTPS video links, inline PDF reading and permitted file downloads.
- A private file request first creates a five-minute HMAC-signed, user/material/version/action-scoped link.
- Delivery rechecks the current entitlement and published version, so refund revocation takes effect even when an earlier link still exists.
- Stored bytes are verified against the version checksum before delivery.
- Every PDF view/download receives a user/date watermark. Every successful delivery writes a material access audit record.
- Raw object keys and storage credentials are never sent to the browser.

`allow_download=false` removes the application download action, but browser PDF viewers are not DRM. Watermarking and access logs provide attribution; screenshots cannot be technically prevented.

## Storage adapters

`STORAGE_PROVIDER=local` is the development/test default and writes into the ignored `.local-storage` directory. It is blocked when `NODE_ENV=production`.

`STORAGE_PROVIDER=s3` supports private AWS S3, Cloudflare R2 and other S3-compatible services through:

- `STORAGE_BUCKET`
- `STORAGE_REGION`
- `STORAGE_ENDPOINT_URL` when the provider requires a custom endpoint
- `STORAGE_ACCESS_KEY_ID`
- `STORAGE_SECRET_ACCESS_KEY`

The current Neon project is in `aws-ap-southeast-1`. Neon Object Storage public beta is available only in `us-east-2`, so no Neon bucket was provisioned. The provider-neutral storage contract allows a later Neon/R2/S3 switch without changing material business rules.

## Database and verification

Migrations `0009_shiny_ultron.sql` and `0010_bright_lockheed.sql` add download policy, immutable file metadata and free/entitlement audit-source constraints. They were applied only to isolated Neon branch `phase-9-materials` (`br-silent-field-b3kuzp53`). Paid access, immediate revoke, free-product access, audit insertion and fixture cleanup passed. Production was not changed.

Final consolidated browser/visual acceptance remains deferred until all planned phases are complete.
