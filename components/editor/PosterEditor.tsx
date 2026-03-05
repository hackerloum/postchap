"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  PosterLayout,
  PosterElement,
  TextElement,
  LogoElement,
  ShapeElement,
} from "@/lib/generation/layoutTypes";
import { ElementPanel, EmptyPanel } from "./ElementPanel";
import { getClientIdToken } from "@/lib/auth-client";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Fabric.js type aliases — the library is browser-only so we import lazily.
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricNS    = any;
type FabricCanvas  = { [key: string]: unknown } & { dispose(): void; add(o: unknown): void; renderAll(): void; getObjects(): FabricNS[]; on(evt: string, cb: FabricNS): void; toDataURL(opts: object): string; toJSON(fields?: string[]): object; loadFromJSON(json: string, cb: () => void): void; setBackgroundImage(img: unknown, cb: unknown): void; };
type FabricObject  = FabricNS;

// Max undo history snapshots kept in memory.
const MAX_HISTORY = 50;

interface Props {
  layout: PosterLayout;
  posterId: string;
  brandColors?: string[];
  onSaved?: (newUrl: string, updatedLayout: PosterLayout) => void;
}

export function PosterEditor({ layout, posterId, brandColors, onSaved }: Props) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef   = useRef<FabricCanvas | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricNSRef = useRef<any>(null); // the fabric namespace (fabric.Canvas, fabric.Textbox, …)
  const layoutRef   = useRef<PosterLayout>(layout);

  const [selected,    setSelected]    = useState<PosterElement | null>(null);
  const [history,     setHistory]     = useState<string[]>([]);
  const [histIdx,     setHistIdx]     = useState(-1);
  const [scale,       setScale]       = useState(1);
  const [exporting,   setExporting]   = useState(false);
  const [fabricReady, setFabricReady] = useState(false);
  const [initError,   setInitError]   = useState<string | null>(null);

  const CANVAS_W = layout.width;
  const CANVAS_H = layout.height;

  // Keep layoutRef in sync with incoming prop (first load only — edits update it via state)
  useEffect(() => { layoutRef.current = layout; }, [layout]);

  // ── Load Fabric.js dynamically (browser-only) ───────────────────────────
  useEffect(() => {
    let mounted = true;
    import("fabric").then((mod) => {
      if (!mounted) return;
      // fabric@5 CJS exports as { fabric: { Canvas, Textbox, … } }
      // Webpack dynamic import wraps CJS: mod.default = the CJS module.exports
      // Fallback chain handles all webpack interop variants:
      //   1. mod.fabric       – if webpack extracts the named export (rare for IIFE bundles)
      //   2. mod.default.fabric – most common: mod.default = { fabric: { … } }
      //   3. mod.default      – if the namespace is the default export directly
      //   4. mod              – last resort
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = mod as any;
      fabricNSRef.current = raw.fabric ?? raw.default?.fabric ?? raw.default ?? raw;
      setFabricReady(true);
    }).catch((err) => {
      console.error("[PosterEditor] Fabric.js load failed:", err);
    });
    return () => { mounted = false; };
  }, []);

  // ── Init Fabric canvas once Fabric is ready ─────────────────────────────
  useEffect(() => {
    if (!fabricReady || !canvasElRef.current || !fabricNSRef.current) return;

    const fabric = fabricNSRef.current;

    if (typeof fabric?.Canvas !== "function") {
      const keys = Object.keys(fabric ?? {}).slice(0, 8).join(", ");
      console.error("[PosterEditor] Fabric.Canvas not found. Keys:", keys, "\nfabric value:", fabric);
      setInitError(`Fabric.js loaded but Canvas constructor is missing (keys: ${keys}). Check the browser console.`);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let canvasInst: any = null;

    try {
      const container = canvasElRef.current.parentElement!;
      // Leave room for the right panel (288px) and some padding
      const availableW = Math.max(container.clientWidth - 320, 300);
      const availableH = Math.max(window.innerHeight - 80, 400);
      const sc = Math.min(availableW / CANVAS_W, availableH / CANVAS_H, 1);
      setScale(sc);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canvasInst = new fabric.Canvas(canvasElRef.current, {
        width:  CANVAS_W * sc,
        height: CANVAS_H * sc,
        backgroundColor: layout.backgroundDominantColor,
        preserveObjectStacking: true,
        selection: true,
      }) as FabricCanvas;
      fabricRef.current = canvasInst;

      // Background image
      fabric.Image.fromURL(
        layout.backgroundImageUrl,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (img: any) => {
          if (!fabricRef.current) return;
          img.scaleToWidth(CANVAS_W * sc);
          img.scaleToHeight(CANVAS_H * sc);
          img.set({
            selectable:    false,
            evented:       false,
            lockMovementX: true,
            lockMovementY: true,
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (canvasInst as any).setBackgroundImage(img, (canvasInst as any).renderAll.bind(canvasInst));
        },
        { crossOrigin: "anonymous" }
      );

      // Render elements sorted by zIndex
      const sorted = [...layout.elements].sort((a, b) => a.zIndex - b.zIndex);
      for (const el of sorted) {
        addElementToCanvas(canvasInst as FabricCanvas, el, sc, fabric, CANVAS_W, CANVAS_H);
      }

      // Selection events
      canvasInst.on("selection:created", (e: { selected?: FabricObject[] }) =>
        syncSelected(e.selected?.[0])
      );
      canvasInst.on("selection:updated", (e: { selected?: FabricObject[] }) =>
        syncSelected(e.selected?.[0])
      );
      canvasInst.on("selection:cleared", () => setSelected(null));
      canvasInst.on("object:modified", () => { if (fabricRef.current) pushHistory(canvasInst as FabricCanvas); });
      canvasInst.on("text:changed",    () => { if (fabricRef.current) pushHistory(canvasInst as FabricCanvas); });

      pushHistory(canvasInst as FabricCanvas);
    } catch (err) {
      console.error("[PosterEditor] Canvas init error:", err);
      setInitError(
        err instanceof Error ? err.message : "Canvas initialization failed. Check the browser console."
      );
    }

    return () => {
      if (canvasInst) {
        canvasInst.dispose();
        fabricRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricReady]);

  // ── Add a single element to the Fabric canvas ──────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function addElementToCanvas(canvas: FabricCanvas, el: PosterElement, sc: number, fabric: any, W: number, H: number) {
    const x = (el.x / 100) * W * sc;
    const y = (el.y / 100) * H * sc;

    if (el.type === "text") {
      const t = el as TextElement;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const textbox: any = new fabric.Textbox(t.content, {
        left:        x,
        top:         y,
        width:       (t.width / 100) * W * sc,
        fontSize:    t.fontSize * sc,
        fontFamily:  t.fontFamily,
        fontWeight:  String(t.fontWeight),
        fill:        t.color,
        textAlign:   t.textAlign,
        lineHeight:  t.lineHeight,
        charSpacing: t.letterSpacing * 1000,
        opacity:     t.opacity,
        selectable:  !t.locked,
        hasControls: !t.locked,
        data: { id: el.id, type: "text" },
      });
      canvas.add(textbox);

    } else if (el.type === "logo") {
      const l = el as LogoElement;
      fabric.Image.fromURL(
        l.src,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (img: any) => {
          const w = (l.width / 100) * W * sc;
          img.scaleToWidth(w);
          img.set({
            left:       x,
            top:        y,
            opacity:    l.opacity,
            selectable: false,
            evented:    false,
            data: { id: el.id, type: "logo" },
          });
          canvas.add(img);
          canvas.renderAll();
        },
        { crossOrigin: "anonymous" }
      );

    } else if (el.type === "shape") {
      const s = el as ShapeElement;
      const rect = new fabric.Rect({
        left:    x,
        top:     y,
        width:   (s.width  / 100) * W * sc,
        height:  (s.height / 100) * H * sc,
        fill:    s.fill,
        opacity: s.opacity,
        rx:      s.borderRadius ?? 0,
        ry:      s.borderRadius ?? 0,
        selectable: !s.locked,
        data: { id: el.id, type: "shape" },
      });
      canvas.add(rect);
    }

    canvas.renderAll();
  }

  // ── Sync React state from Fabric selection ──────────────────────────────
  function syncSelected(obj?: FabricObject) {
    if (!obj) { setSelected(null); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id: string | undefined = (obj as any).data?.id;
    if (!id) { setSelected(null); return; }
    const el = layoutRef.current.elements.find((e) => e.id === id) ?? null;
    setSelected(el);
  }

  // ── History (undo / redo) ───────────────────────────────────────────────
  function pushHistory(canvas: FabricCanvas) {
    const json = JSON.stringify(canvas.toJSON(["data"]));
    setHistory((prev) => {
      const trimmed = prev.slice(0, histIdx + 1);
      const next = [...trimmed, json].slice(-MAX_HISTORY);
      return next;
    });
    setHistIdx((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
  }

  function undo() {
    const canvas = fabricRef.current;
    if (!canvas || histIdx <= 0) return;
    const snap = history[histIdx - 1];
    if (!snap) return;
    canvas.loadFromJSON(snap, () => { canvas.renderAll(); });
    setHistIdx((i) => i - 1);
  }

  function redo() {
    const canvas = fabricRef.current;
    if (!canvas || histIdx >= history.length - 1) return;
    const snap = history[histIdx + 1];
    if (!snap) return;
    canvas.loadFromJSON(snap, () => { canvas.renderAll(); });
    setHistIdx((i) => i + 1);
  }

  // ── Update an element property (from ElementPanel) ─────────────────────
  const updateElement = useCallback(
    (id: string, changes: Partial<PosterElement>) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      // 1. Update Fabric object on canvas
      const objects = canvas.getObjects();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj = objects.find((o: any) => o.data?.id === id);
      if (obj) {
        if (obj.type === "textbox") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tb = obj as any;
          const t = changes as Partial<TextElement>;
          if ("content"      in t) tb.set("text",       t.content!);
          if ("color"        in t) tb.set("fill",        t.color!);
          if ("fontSize"     in t) tb.set("fontSize",    t.fontSize! * scale);
          if ("fontFamily"   in t) tb.set("fontFamily",  t.fontFamily!);
          if ("fontWeight"   in t) tb.set("fontWeight",  String(t.fontWeight!));
          if ("textAlign"    in t) tb.set("textAlign",   t.textAlign!);
          if ("opacity"      in t) tb.set("opacity",     t.opacity!);
          if ("lineHeight"   in t) tb.set("lineHeight",  t.lineHeight!);
          if ("letterSpacing" in t) tb.set("charSpacing", t.letterSpacing! * 1000);
        } else if (obj.type === "rect") {
          const s = changes as Partial<ShapeElement>;
          if ("fill"    in s) obj.set("fill",    s.fill!);
          if ("opacity" in s) obj.set("opacity", s.opacity!);
        }
        canvas.renderAll();
        pushHistory(canvas);
      }

      // 2. Update layout ref and selected state
      layoutRef.current = {
        ...layoutRef.current,
        elements: layoutRef.current.elements.map((el) =>
          el.id === id ? ({ ...el, ...changes } as PosterElement) : el
        ),
      };
      setSelected((prev) =>
        prev?.id === id ? ({ ...prev, ...changes } as PosterElement) : prev
      );
    },
    [scale]
  );

  // ── Apply brand primary color to all text elements ──────────────────────
  const applyBrandColorsToAll = useCallback(() => {
    if (!brandColors || brandColors.length === 0) return;
    const primary = brandColors[0];
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.getObjects().forEach((obj) => {
      if (obj.type === "textbox") {
        obj.set("fill", primary);
      }
    });
    canvas.renderAll();
    pushHistory(canvas);
    layoutRef.current = {
      ...layoutRef.current,
      elements: layoutRef.current.elements.map((el) =>
        el.type === "text" ? ({ ...el, color: primary } as TextElement) : el
      ),
    };
    toast.success("Brand color applied to all text");
  }, [brandColors]);

  // ── Export and save ─────────────────────────────────────────────────────
  async function handleExport() {
    const canvas = fabricRef.current;
    if (!canvas || exporting) return;

    setExporting(true);
    try {
      // Scale up to full resolution for export
      const multiplier = CANVAS_W / (CANVAS_W * scale);
      const dataURL = canvas.toDataURL({
        format:     "png",
        multiplier,
        quality:    1,
      });

      const token = await getClientIdToken();
      const res = await fetch(`/api/posters/${posterId}/save-edit`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          dataURL,
          layout: layoutRef.current,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Save failed");
      }

      const { url } = (await res.json()) as { url: string };
      toast.success("Poster saved!");
      onSaved?.(url, layoutRef.current);
    } catch (err) {
      console.error("[PosterEditor] export failed:", err);
      toast.error("Failed to save poster — please try again");
    } finally {
      setExporting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  if (initError) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#080808] gap-4 p-8">
        <p className="text-white font-semibold text-center">Editor failed to initialise</p>
        <p className="text-[#888] text-sm text-center max-w-sm">{initError}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-[#e8ff47] underline underline-offset-4"
        >
          Reload page
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#080808] overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center gap-3 px-4 h-12 bg-[#0f0f0f] border-b
                      border-[#1e1e1e] z-50 shrink-0">
        <span className="text-[#e8ff47] font-bold text-sm tracking-tight">
          Poster Editor
        </span>
        <div className="flex-1" />
        <ToolbarBtn onClick={undo} disabled={histIdx <= 0}>↩ Undo</ToolbarBtn>
        <ToolbarBtn onClick={redo} disabled={histIdx >= history.length - 1}>↪ Redo</ToolbarBtn>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="bg-[#e8ff47] text-black px-4 py-1.5 rounded font-bold text-sm
                     hover:bg-yellow-300 transition-colors disabled:opacity-50
                     disabled:cursor-not-allowed"
        >
          {exporting ? "Saving…" : "Save & Export"}
        </button>
      </div>

      {/* Body: canvas + right panel */}
      <div className="flex flex-1 min-h-0">
        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center overflow-auto
                        bg-[#0a0a0a] p-6">
          <div className="shadow-2xl shadow-black/60 rounded overflow-hidden">
            {!fabricReady && (
              <div
                style={{ width: CANVAS_W * scale, height: CANVAS_H * scale }}
                className="flex items-center justify-center bg-[#111]"
              >
                <span className="text-[#555] text-sm">Loading editor…</span>
              </div>
            )}
            <canvas ref={canvasElRef} style={{ display: fabricReady ? "block" : "none" }} />
          </div>
        </div>

        {/* Right panel */}
        <div className="w-72 bg-[#0f0f0f] border-l border-[#1e1e1e] overflow-y-auto
                        scrollbar-hide shrink-0">
          <div className="py-3 px-4 border-b border-[#1e1e1e]">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#555]">
              {selected ? `Editing: ${selected.id}` : "Elements"}
            </h3>
          </div>

          {selected ? (
            <ElementPanel
              element={selected}
              brandColors={brandColors}
              onChange={updateElement}
              onApplyBrandColorsToAll={applyBrandColorsToAll}
            />
          ) : (
            <EmptyPanel />
          )}
        </div>
      </div>
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[#888]
                 text-xs rounded hover:border-[#444] hover:text-white transition-colors
                 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
