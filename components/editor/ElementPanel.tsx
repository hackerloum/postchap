"use client";

import type {
  PosterElement,
  TextElement,
  ShapeElement,
} from "@/lib/generation/layoutTypes";

const FONT_FAMILIES = [
  "Syne",
  "DM Sans",
  "Playfair Display",
  "Space Grotesk",
  "Inter",
  "Bebas Neue",
  "Oswald",
  "Montserrat",
];

interface Props {
  element: PosterElement;
  brandColors?: string[];
  onChange: (id: string, changes: Partial<PosterElement>) => void;
  onApplyBrandColorsToAll?: () => void;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-mono text-[10px] uppercase tracking-wider text-[#555] mb-1.5">
      {children}
    </label>
  );
}

function PanelSection({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}

export function ElementPanel({ element, brandColors, onChange, onApplyBrandColorsToAll }: Props) {
  const ch = (changes: Partial<PosterElement>) => onChange(element.id, changes);

  if (element.type === "text") {
    const el = element as TextElement;

    return (
      <div className="p-4 space-y-4 text-white">
        {/* Text content */}
        <PanelSection>
          <Label>Text</Label>
          <textarea
            value={el.content}
            onChange={(e) => ch({ content: e.target.value } as Partial<TextElement>)}
            rows={3}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2
                       text-[13px] text-white outline-none focus:border-[#e8ff47]
                       transition-colors resize-none"
          />
        </PanelSection>

        {/* Brand color swatches */}
        {brandColors && brandColors.length > 0 && (
          <PanelSection>
            <Label>Brand Colors</Label>
            <div className="flex gap-1.5 flex-wrap">
              {brandColors.map((color) => (
                <button
                  key={color}
                  onClick={() => ch({ color } as Partial<TextElement>)}
                  style={{ backgroundColor: color }}
                  className="w-7 h-7 rounded-full border-2 border-[#333]
                             hover:border-[#e8ff47] transition-colors shrink-0"
                  title={color}
                />
              ))}
            </div>
            {onApplyBrandColorsToAll && (
              <button
                onClick={onApplyBrandColorsToAll}
                className="mt-1.5 w-full py-1.5 text-xs text-[#e8ff47] border
                           border-[#e8ff47]/30 rounded hover:bg-[#e8ff47]/10 transition-colors"
              >
                Apply brand colors to all text
              </button>
            )}
          </PanelSection>
        )}

        {/* Text color */}
        <PanelSection>
          <Label>Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={el.color}
              onChange={(e) => ch({ color: e.target.value } as Partial<TextElement>)}
              className="w-10 h-10 rounded cursor-pointer border border-[#333] bg-transparent"
            />
            <input
              type="text"
              value={el.color}
              onChange={(e) => ch({ color: e.target.value } as Partial<TextElement>)}
              className="flex-1 bg-[#1a1a1a] border border-[#333] rounded px-2 py-1
                         font-mono text-xs text-white outline-none focus:border-[#e8ff47]"
            />
          </div>
        </PanelSection>

        {/* Font size */}
        <PanelSection>
          <Label>Font Size</Label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={10}
              max={120}
              value={el.fontSize}
              onChange={(e) =>
                ch({ fontSize: Number(e.target.value) } as Partial<TextElement>)
              }
              className="flex-1 accent-[#e8ff47]"
            />
            <span className="text-white text-sm w-8 text-right tabular-nums">
              {el.fontSize}
            </span>
          </div>
        </PanelSection>

        {/* Font family */}
        <PanelSection>
          <Label>Font Family</Label>
          <select
            value={el.fontFamily}
            onChange={(e) =>
              ch({ fontFamily: e.target.value } as Partial<TextElement>)
            }
            className="w-full bg-[#1a1a1a] border border-[#333] rounded px-2 py-1.5
                       text-[13px] text-white outline-none focus:border-[#e8ff47] cursor-pointer"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </PanelSection>

        {/* Font weight */}
        <PanelSection>
          <Label>Font Weight</Label>
          <div className="flex gap-1">
            {([400, 600, 700, 900] as const).map((w) => (
              <button
                key={w}
                onClick={() => ch({ fontWeight: w } as Partial<TextElement>)}
                className={`flex-1 py-1.5 text-xs rounded border transition-colors
                  ${
                    el.fontWeight === w
                      ? "bg-[#e8ff47] text-black border-[#e8ff47] font-bold"
                      : "bg-[#1a1a1a] text-[#888] border-[#333] hover:border-[#555]"
                  }`}
              >
                {w === 400 ? "Reg" : w === 600 ? "Semi" : w === 700 ? "Bold" : "Black"}
              </button>
            ))}
          </div>
        </PanelSection>

        {/* Text align */}
        <PanelSection>
          <Label>Align</Label>
          <div className="flex gap-1">
            {(["left", "center", "right"] as const).map((a) => (
              <button
                key={a}
                onClick={() => ch({ textAlign: a } as Partial<TextElement>)}
                className={`flex-1 py-1.5 text-sm rounded border transition-colors
                  ${
                    el.textAlign === a
                      ? "bg-[#e8ff47] text-black border-[#e8ff47]"
                      : "bg-[#1a1a1a] text-[#888] border-[#333] hover:border-[#555]"
                  }`}
              >
                {a === "left" ? "←" : a === "center" ? "↔" : "→"}
              </button>
            ))}
          </div>
        </PanelSection>

        {/* Opacity */}
        <PanelSection>
          <Label>Opacity</Label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={el.opacity}
              onChange={(e) =>
                ch({ opacity: Number(e.target.value) } as Partial<TextElement>)
              }
              className="flex-1 accent-[#e8ff47]"
            />
            <span className="text-white text-xs w-8 text-right tabular-nums">
              {Math.round(el.opacity * 100)}%
            </span>
          </div>
        </PanelSection>

        <div className="pt-2 border-t border-[#222]">
          <button
            onClick={() => ch({ content: "" } as Partial<TextElement>)}
            className="w-full py-2 text-xs text-[#ef4444] border border-[#ef4444]/30
                       rounded hover:bg-[#ef4444]/10 transition-colors"
          >
            Clear text
          </button>
        </div>
      </div>
    );
  }

  if (element.type === "shape") {
    const el = element as ShapeElement;

    return (
      <div className="p-4 space-y-4 text-white">
        <PanelSection>
          <Label>Fill Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={el.fill}
              onChange={(e) => ch({ fill: e.target.value } as Partial<ShapeElement>)}
              className="w-10 h-10 rounded cursor-pointer border border-[#333] bg-transparent"
            />
            <input
              type="text"
              value={el.fill}
              onChange={(e) => ch({ fill: e.target.value } as Partial<ShapeElement>)}
              className="flex-1 bg-[#1a1a1a] border border-[#333] rounded px-2 py-1
                         font-mono text-xs text-white outline-none focus:border-[#e8ff47]"
            />
          </div>
        </PanelSection>

        <PanelSection>
          <Label>Opacity</Label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={el.opacity}
              onChange={(e) =>
                ch({ opacity: Number(e.target.value) } as Partial<ShapeElement>)
              }
              className="flex-1 accent-[#e8ff47]"
            />
            <span className="text-white text-xs w-8 text-right tabular-nums">
              {Math.round(el.opacity * 100)}%
            </span>
          </div>
        </PanelSection>
      </div>
    );
  }

  if (element.type === "logo") {
    return (
      <div className="p-4">
        <p className="text-[#888] text-xs">
          Logo is locked and managed through your Brand Kit.
          To change it, update your brand kit.
        </p>
      </div>
    );
  }

  return null;
}

export function EmptyPanel() {
  return (
    <div className="p-4 text-center mt-6">
      <p className="text-[#555] text-sm leading-relaxed">
        Click any text or shape<br />on the poster to edit it
      </p>
      <div className="mt-5 space-y-1.5 text-[#333] text-xs">
        <p>↕ Drag to move</p>
        <p>⬜ Corner handles to resize</p>
        <p>✏️ Double-click text to edit</p>
      </div>
    </div>
  );
}
