"use client";

import type { OnProgressParameters, PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { useEffect, useId, useRef, useState } from "react";

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));
const MAX_RENDER_PIXELS = 12_000_000;

export function SecurePdfViewer({ src, title }: { src: string; title: string }) {
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
        const response = await fetch(src, { credentials: "same-origin", signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("The protected document could not be loaded.");
        const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
        if (!contentType.startsWith("application/pdf")) throw new Error("This resource is not a valid PDF document.");
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const bytes = new Uint8Array(await response.arrayBuffer());
        const task = pdfjs.getDocument({ data: bytes });
        loadingTaskRef.current = task;
        task.onProgress = ({ loaded, total }: OnProgressParameters) => setProgress(total ? Math.round((loaded / total) * 100) : 0);
        const document = await task.promise;
        documentRef.current = document;
        setPageCount(document.numPages); setPageNumber(1); setProgress(100);
      } catch (value) {
        if (!controller.signal.aborted) setError(value instanceof Error ? value.message : "The protected document could not be loaded.");
      }
    }
    void load();
    return () => { controller.abort(); renderTaskRef.current?.cancel(); void loadingTaskRef.current?.destroy(); loadingTaskRef.current = null; documentRef.current = null; };
  }, [src]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const resize = new ResizeObserver(entries => {
      const box = entries[0]?.contentRect;
      const width = Math.floor(box?.width ?? 0);
      const height = Math.floor(box?.height ?? 0);
      setStageSize(current => current.width === width && current.height === height ? current : { width, height });
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
        if (!cancelled) setPageText(textContent.items.map(item => "str" in item ? item.str : "").filter(Boolean).join(" "));
      } catch {
        if (!cancelled) setPageText("");
      }
    })();
    return () => { cancelled = true; };
  }, [pageCount, pageNumber]);

  useEffect(() => {
    const document = documentRef.current;
    const canvas = canvasRef.current;
    if (!document || !canvas || !stageSize.width || !stageSize.height || !pageCount) return;
    let cancelled = false;
    renderTaskRef.current?.cancel();
    void (async () => {
      try {
        const page = await document.getPage(pageNumber);
        if (cancelled) return;
        setRendering(true); setError("");
        const base = page.getViewport({ scale: 1 });
        const stagePadding = stageSize.width < 700 ? 16 : 48;
        const availableWidth = Math.max(1, stageSize.width - stagePadding);
        const availableHeight = Math.max(1, stageSize.height - stagePadding);
        const fittedScale = fitMode === "page"
          ? Math.min(availableWidth / base.width, availableHeight / base.height)
          : availableWidth / base.width;
        const viewport = page.getViewport({ scale: Math.max(.1, fittedScale * zoom) });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const pixelBudgetScale = Math.sqrt(MAX_RENDER_PIXELS / Math.max(1, viewport.width * viewport.height));
        const outputScale = Math.min(pixelRatio, pixelBudgetScale);
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        const task = page.render({ canvas, viewport, transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0] });
        renderTaskRef.current = task;
        await task.promise;
        if (!cancelled) setRendering(false);
      } catch (value) {
        if (!cancelled && (value as { name?: string }).name !== "RenderingCancelledException") setError("This page could not be rendered. Try reloading the document.");
      }
    })();
    return () => { cancelled = true; renderTaskRef.current?.cancel(); };
  }, [fitMode, pageCount, pageNumber, stageSize, zoom]);

  function move(delta: number) { setPageNumber(current => clamp(current + delta, 1, pageCount)); stageRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }
  function fit(mode: "page" | "width") { setFitMode(mode); setZoom(1); stageRef.current?.scrollTo({ top: 0, left: 0, behavior: "smooth" }); }
  async function toggleFullscreen() { const host=hostRef.current;if(!host)return;if(document.fullscreenElement)await document.exitFullscreen();else await host.requestFullscreen(); }

  if (error && !pageCount) return <div className="pdf-reader-state" role="alert"><strong>Document unavailable</strong><p>{error}</p><button type="button" onClick={()=>window.location.reload()}>Try again</button></div>;
  return <section className="secure-pdf-reader" ref={hostRef} aria-label={`Secure document reader: ${title}`} onKeyDown={event=>{if(event.key==="ArrowLeft")move(-1);if(event.key==="ArrowRight")move(1);}} tabIndex={0}>
    <header className="secure-pdf-controls">
      <div className="pdf-page-controls"><button type="button" onClick={()=>move(-1)} disabled={pageNumber<=1} aria-label="Previous page">←</button><span>Page <b>{pageCount?pageNumber:"–"}</b> of {pageCount||"–"}</span><button type="button" onClick={()=>move(1)} disabled={!pageCount||pageNumber>=pageCount} aria-label="Next page">→</button></div>
      <div className="pdf-zoom-controls"><button type="button" onClick={()=>setZoom(value=>clamp(Number((value-.15).toFixed(2)),.6,2))} disabled={zoom<=.6} aria-label="Zoom out">−</button><span className="pdf-zoom-value" aria-label={`Zoom ${Math.round(zoom*100)} percent`}>{Math.round(zoom*100)}%</span><button type="button" onClick={()=>setZoom(value=>clamp(Number((value+.15).toFixed(2)),.6,2))} disabled={zoom>=2} aria-label="Zoom in">＋</button><button type="button" className="pdf-fit-control" aria-pressed={fitMode==="page"&&zoom===1} onClick={()=>fit("page")}>Fit page</button><button type="button" className="pdf-fit-control" aria-pressed={fitMode==="width"&&zoom===1} onClick={()=>fit("width")}>Fit width</button><button type="button" className="pdf-fullscreen-control" onClick={toggleFullscreen}>Full screen</button></div>
    </header>
    <div className="secure-pdf-stage" ref={stageRef} onContextMenu={event=>event.preventDefault()}>
      {!pageCount?<div className="pdf-reader-state" role="status"><span className="pdf-loader"/><strong>Loading secure document…</strong><small>{progress?`${progress}%`:"Checking access"}</small></div>:null}
      <div className="secure-pdf-page" aria-busy={rendering}><canvas ref={canvasRef} role="img" aria-label={`${title}, page ${pageNumber} of ${pageCount}`} aria-describedby={pageDescriptionId} draggable={false}/><div className="sr-only" id={pageDescriptionId}>{pageText||`Page ${pageNumber} has no extractable text.`}</div>{rendering&&pageCount?<span className="pdf-page-loading" role="status">Rendering page {pageNumber}…</span>:null}</div>
    </div>
    <footer className="secure-pdf-footer"><span>Personal study copy</span><span>Access protected</span><span>Use ← → keys to change page</span></footer>
    {error&&pageCount?<p className="notice danger" role="alert">{error}</p>:null}
  </section>;
}
