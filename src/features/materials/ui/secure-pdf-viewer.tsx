"use client";

import type {
  OnProgressParameters,
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  RenderTask,
} from "pdfjs-dist";
import { useEffect, useId, useRef, useState } from "react";

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));
const MAX_RENDER_PIXELS = 12_000_000;
const controlButtonClass =
  "inline-grid h-[2.35rem] min-w-[2.35rem] shrink-0 cursor-pointer place-items-center rounded-[.4rem] border border-[#505050] bg-[#252525] px-[.55rem] py-[.35rem] text-[.78rem] text-white hover:border-[#f07950] hover:bg-[#333] focus-visible:border-[#f07950] focus-visible:bg-[#333] disabled:cursor-not-allowed disabled:opacity-38 max-[700px]:h-9";

export function SecurePdfViewer({
  src,
  title,
}: {
  src: string;
  title: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const documentRef = useRef<PDFDocumentProxy | null>(null);
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const pageDescriptionId = useId();
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<"page" | "width">("page");
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [progress, setProgress] = useState(0);
  const [rendering, setRendering] = useState(true);
  const [pageText, setPageText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(src, {
          credentials: "same-origin",
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok)
          throw new Error("The protected document could not be loaded.");
        const contentType =
          response.headers.get("content-type")?.toLowerCase() ?? "";
        if (!contentType.startsWith("application/pdf"))
          throw new Error("This resource is not a valid PDF document.");
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        const bytes = new Uint8Array(await response.arrayBuffer());
        const task = pdfjs.getDocument({ data: bytes });
        loadingTaskRef.current = task;
        task.onProgress = ({ loaded, total }: OnProgressParameters) =>
          setProgress(total ? Math.round((loaded / total) * 100) : 0);
        const document = await task.promise;
        documentRef.current = document;
        setPageCount(document.numPages);
        setPageNumber(1);
        setProgress(100);
      } catch (value) {
        if (!controller.signal.aborted)
          setError(
            value instanceof Error
              ? value.message
              : "The protected document could not be loaded.",
          );
      }
    }
    void load();
    return () => {
      controller.abort();
      renderTaskRef.current?.cancel();
      void loadingTaskRef.current?.destroy();
      loadingTaskRef.current = null;
      documentRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const resize = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      const width = Math.floor(box?.width ?? 0);
      const height = Math.floor(box?.height ?? 0);
      setStageSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      );
    });
    resize.observe(stage);
    return () => resize.disconnect();
  }, []);

  useEffect(() => {
    const document = documentRef.current;
    if (!document || !pageCount) return;
    let cancelled = false;
    void (async () => {
      try {
        const page = await document.getPage(pageNumber);
        const textContent = await page.getTextContent();
        if (!cancelled)
          setPageText(
            textContent.items
              .map((item) => ("str" in item ? item.str : ""))
              .filter(Boolean)
              .join(" "),
          );
      } catch {
        if (!cancelled) setPageText("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageCount, pageNumber]);

  useEffect(() => {
    const document = documentRef.current;
    const canvas = canvasRef.current;
    if (
      !document ||
      !canvas ||
      !stageSize.width ||
      !stageSize.height ||
      !pageCount
    )
      return;
    let cancelled = false;
    renderTaskRef.current?.cancel();
    void (async () => {
      try {
        const page = await document.getPage(pageNumber);
        if (cancelled) return;
        setRendering(true);
        setError("");
        const base = page.getViewport({ scale: 1 });
        const stagePadding = stageSize.width < 700 ? 16 : 48;
        const availableWidth = Math.max(1, stageSize.width - stagePadding);
        const availableHeight = Math.max(1, stageSize.height - stagePadding);
        const fittedScale =
          fitMode === "page"
            ? Math.min(
                availableWidth / base.width,
                availableHeight / base.height,
              )
            : availableWidth / base.width;
        const viewport = page.getViewport({
          scale: Math.max(0.1, fittedScale * zoom),
        });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const pixelBudgetScale = Math.sqrt(
          MAX_RENDER_PIXELS / Math.max(1, viewport.width * viewport.height),
        );
        const outputScale = Math.min(pixelRatio, pixelBudgetScale);
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        const task = page.render({
          canvas,
          viewport,
          transform:
            outputScale === 1
              ? undefined
              : [outputScale, 0, 0, outputScale, 0, 0],
        });
        renderTaskRef.current = task;
        await task.promise;
        if (!cancelled) setRendering(false);
      } catch (value) {
        if (
          !cancelled &&
          (value as { name?: string }).name !== "RenderingCancelledException"
        )
          setError(
            "This page could not be rendered. Try reloading the document.",
          );
      }
    })();
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [fitMode, pageCount, pageNumber, stageSize, zoom]);

  function move(delta: number) {
    setPageNumber((current) => clamp(current + delta, 1, pageCount));
    stageRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }
  function fit(mode: "page" | "width") {
    setFitMode(mode);
    setZoom(1);
    stageRef.current?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }
  async function toggleFullscreen() {
    const host = hostRef.current;
    if (!host) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await host.requestFullscreen();
  }

  if (error && !pageCount)
    return (
      <div
        className="grid min-h-128 place-items-center content-center gap-[.65rem] rounded-b-[.55rem] border border-t-0 border-[#ddd9d4] bg-[#f7f6f4] p-6 text-center text-[#555d63]"
        role="alert"
      >
        <strong>Document unavailable</strong>
        <p className="m-0 max-w-lg text-[.78rem] leading-relaxed">{error}</p>
        <button
          className="rounded-[.35rem] border border-[#e84916] bg-white px-[.9rem] py-[.55rem] text-[.75rem] font-bold text-[#dd4312]"
          type="button"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  return (
    <section
      className="grid h-[calc(100dvh-9rem)] min-h-[42rem] min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-b-[.6rem] border border-[#d8d4cf] bg-[#262626] text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#f07950] fullscreen:h-dvh fullscreen:min-h-0 fullscreen:rounded-none fullscreen:border-0 max-[700px]:h-[calc(100svh-5rem)] max-[700px]:min-h-[44rem] max-[380px]:min-h-[40rem] [&:fullscreen_[data-pdf-stage]]:p-4"
      ref={hostRef}
      aria-label={`Secure document reader: ${title}`}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") move(-1);
        if (event.key === "ArrowRight") move(1);
      }}
      tabIndex={0}
    >
      <header className="relative z-[2] flex min-h-[3.25rem] items-center justify-between gap-3 border-b border-[#454545] bg-[#171717] px-[.7rem] py-[.45rem] max-[700px]:flex-col max-[700px]:items-stretch max-[700px]:p-[.45rem]">
        <div className="flex items-center gap-[.35rem] max-[700px]:justify-center">
          <button
            className={controlButtonClass}
            type="button"
            onClick={() => move(-1)}
            disabled={pageNumber <= 1}
            aria-label="Previous page"
          >
            ←
          </button>
          <span className="min-w-[7.5rem] text-center text-[.74rem] [font-variant-numeric:tabular-nums] max-[700px]:flex-1">
            Page <b>{pageCount ? pageNumber : "–"}</b> of {pageCount || "–"}
          </span>
          <button
            className={controlButtonClass}
            type="button"
            onClick={() => move(1)}
            disabled={!pageCount || pageNumber >= pageCount}
            aria-label="Next page"
          >
            →
          </button>
        </div>
        <div className="flex flex-nowrap items-center justify-end gap-[.35rem] max-[700px]:justify-start max-[700px]:overflow-x-auto max-[700px]:pb-0.5 max-[700px]:[scrollbar-width:none] max-[700px]:[&::-webkit-scrollbar]:hidden">
          <button
            className={controlButtonClass}
            type="button"
            onClick={() =>
              setZoom((value) =>
                clamp(Number((value - 0.15).toFixed(2)), 0.6, 2),
              )
            }
            disabled={zoom <= 0.6}
            aria-label="Zoom out"
          >
            −
          </button>
          <span
            className="min-w-[3.1rem] text-center text-[.7rem] text-[#ddd] [font-variant-numeric:tabular-nums]"
            aria-label={`Zoom ${Math.round(zoom * 100)} percent`}
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            className={controlButtonClass}
            type="button"
            onClick={() =>
              setZoom((value) =>
                clamp(Number((value + 0.15).toFixed(2)), 0.6, 2),
              )
            }
            disabled={zoom >= 2}
            aria-label="Zoom in"
          >
            ＋
          </button>
          <button
            className={`${controlButtonClass} min-w-0 px-[.7rem] aria-pressed:border-[#ef6a3d] aria-pressed:bg-[#3a2923]`}
            type="button"
            aria-pressed={fitMode === "page" && zoom === 1}
            onClick={() => fit("page")}
          >
            Fit page
          </button>
          <button
            className={`${controlButtonClass} min-w-0 px-[.7rem] aria-pressed:border-[#ef6a3d] aria-pressed:bg-[#3a2923]`}
            type="button"
            aria-pressed={fitMode === "width" && zoom === 1}
            onClick={() => fit("width")}
          >
            Fit width
          </button>
          <button
            className={`${controlButtonClass} min-w-0 px-3 max-[380px]:text-[.72rem]`}
            type="button"
            onClick={toggleFullscreen}
          >
            Full screen
          </button>
        </div>
      </header>
      <div
        className="relative min-h-0 overflow-auto bg-[#292929] p-6 [overscroll-behavior:contain] [scrollbar-color:#777_#292929] [touch-action:pan-x_pan-y] max-[700px]:px-2 max-[700px]:py-[.65rem]"
        data-pdf-stage
        ref={stageRef}
        onContextMenu={(event) => event.preventDefault()}
      >
        {!pageCount ? (
          <div
            className="grid h-full min-h-80 w-full place-items-center content-center gap-[.65rem] bg-[#292929] text-[#f2f2f2]"
            role="status"
          >
            <span className="size-[1.7rem] animate-spin rounded-full border-2 border-[#efd8cf] border-t-[#e84916]" />
            <strong>Loading secure document…</strong>
            <small className="text-[#bbb]">
              {progress ? `${progress}%` : "Checking access"}
            </small>
          </div>
        ) : null}
        <div
          className="relative grid min-h-full min-w-max place-items-center"
          aria-busy={rendering}
        >
          <canvas
            className="block max-w-none bg-white shadow-[0_.5rem_2rem_rgba(0,0,0,.32)] select-none"
            ref={canvasRef}
            role="img"
            aria-label={`${title}, page ${pageNumber} of ${pageCount}`}
            aria-describedby={pageDescriptionId}
            draggable={false}
          />
          <div className="sr-only" id={pageDescriptionId}>
            {pageText || `Page ${pageNumber} has no extractable text.`}
          </div>
          {rendering && pageCount ? (
            <span
              className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-[rgba(20,20,20,.88)] px-[.7rem] py-[.45rem] text-[.72rem] text-white"
              role="status"
            >
              Rendering page {pageNumber}…
            </span>
          ) : null}
        </div>
      </div>
      <footer className="flex justify-center gap-5 border-t border-[#454545] bg-[#171717] px-3 py-[.45rem] text-[.64rem] text-[#b8b8b8] max-[700px]:justify-around max-[700px]:gap-[.55rem] max-[380px]:text-[.58rem] [&_span]:before:mr-[.3rem] [&_span]:before:text-[#ef6a3d] [&_span]:before:content-['✓']">
        <span>Personal study copy</span>
        <span>Access protected</span>
        <span className="max-[700px]:hidden">Use ← → keys to change page</span>
      </footer>
      {error && pageCount ? (
        <p
          className="m-0 border-t border-[#efc1bd] bg-[#fdebea] px-4 py-3 text-[.75rem] text-[#ad3028]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}
