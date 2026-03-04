"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  Loader2,
  Package,
  Pencil,
  Trash2,
  Sparkles,
  X,
  Upload,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { getAuthClient } from "@/lib/firebase/client";
import { getClientIdToken } from "@/lib/auth-client";
import type { Product } from "@/types/generation";

interface BrandKit {
  id: string;
  brandName: string;
  brandLocation?: { currency?: string };
}

const CATEGORIES = [
  "Electronics", "Fashion", "Food & Drink", "Beauty", "Health",
  "Home & Living", "Sports", "Services", "Education", "Travel",
  "Finance", "Technology", "Other",
];

const URGENCY_LABELS: Record<string, string> = {
  none: "None",
  limited_stock: "Limited stock",
  ends_soon: "Ends soon",
  ends_today: "Ends today",
  ends_sunday: "Ends Sunday",
};

function formatCurrency(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency,
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${price.toLocaleString()}`;
  }
}

export default function ProductsPage() {
  const router = useRouter();
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [selectedKitId, setSelectedKitId] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingKits, setLoadingKits] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    name: "", description: "", price: "", currency: "USD",
    discountPrice: "", category: "", inStock: true, tags: "",
  });
  const [formImages, setFormImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load brand kits on auth
  useEffect(() => {
    const auth = getAuthClient();
    let cancelled = false;
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { setLoadingKits(false); return; }
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/brand-kits", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!cancelled) {
          const list: BrandKit[] = data.brandKits ?? [];
          setKits(list);
          if (list.length > 0) setSelectedKitId(list[0].id);
        }
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoadingKits(false); }
    });
    return () => { cancelled = true; unsub(); };
  }, []);

  // Load products when kit changes
  useEffect(() => {
    if (!selectedKitId) { setProducts([]); return; }
    let cancelled = false;
    setLoadingProducts(true);
    (async () => {
      try {
        const token = await getClientIdToken();
        const res = await fetch(`/api/brand-kits/${selectedKitId}/products`, {
          headers: { Authorization: `Bearer ${token ?? ""}` },
        });
        const data = await res.json();
        if (!cancelled) setProducts(data.products ?? []);
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoadingProducts(false); }
    })();
    return () => { cancelled = true; };
  }, [selectedKitId]);

  const selectedKit = kits.find(k => k.id === selectedKitId);

  function openAdd() {
    setEditingProduct(null);
    setForm({
      name: "", description: "", price: "", currency: selectedKit?.brandLocation?.currency ?? "USD",
      discountPrice: "", category: "", inStock: true, tags: "",
    });
    setFormImages([]);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setForm({
      name:          product.name,
      description:   product.description,
      price:         String(product.price),
      currency:      product.currency,
      discountPrice: product.discountPrice != null ? String(product.discountPrice) : "",
      category:      product.category,
      inStock:       product.inStock,
      tags:          product.tags?.join(", ") ?? "",
    });
    setFormImages(product.images ?? []);
    setFormOpen(true);
  }

  async function handleUploadImage(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10MB"); return; }
    setUploadingImage(true);
    try {
      const token = await getClientIdToken();
      const fd = new FormData();
      fd.append("file", file);
      fd.append("productId", editingProduct?.id ?? `prod_${Date.now()}`);
      const res = await fetch("/api/upload/product-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token ?? ""}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Upload failed"); return; }
      setFormImages(prev => [...prev, data.url].slice(0, 5));
      toast.success("Photo uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSave() {
    if (!selectedKitId) { toast.error("Select a brand kit"); return; }
    if (!form.name.trim()) { toast.error("Product name is required"); return; }
    if (!form.price || isNaN(Number(form.price))) { toast.error("Valid price is required"); return; }

    setSaving(true);
    try {
      const token = await getClientIdToken();
      const payload = {
        name:          form.name.trim(),
        description:   form.description.trim(),
        price:         Number(form.price),
        currency:      form.currency,
        discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
        category:      form.category,
        inStock:       form.inStock,
        images:        formImages,
        tags:          form.tags.split(",").map(t => t.trim()).filter(Boolean),
      };

      const url = editingProduct
        ? `/api/brand-kits/${selectedKitId}/products/${editingProduct.id}`
        : `/api/brand-kits/${selectedKitId}/products`;
      const method = editingProduct ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token ?? ""}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Save failed"); return; }

      toast.success(editingProduct ? "Product updated" : "Product created");
      setFormOpen(false);

      // Reload products
      const listRes = await fetch(`/api/brand-kits/${selectedKitId}/products`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      const listData = await listRes.json();
      setProducts(listData.products ?? []);
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    const token = await getClientIdToken();
    setDeletingId(product.id);
    try {
      const res = await fetch(`/api/brand-kits/${selectedKitId}/products/${product.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (!res.ok) { toast.error("Delete failed"); return; }
      setProducts(prev => prev.filter(p => p.id !== product.id));
      toast.success("Product deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  if (loadingKits) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 size={20} className="text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-semibold text-[22px] text-text-primary tracking-tight flex items-center gap-2">
            <Package size={20} className="text-accent" />
            Products
          </h1>
          <p className="font-mono text-[12px] text-text-muted mt-1">
            Add your products to generate product posters in one click
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          disabled={kits.length === 0}
          className="inline-flex items-center gap-2 bg-accent text-black font-semibold text-[13px] px-4 py-2.5 rounded-lg hover:bg-accent-dim transition-colors min-h-[40px] disabled:opacity-50"
        >
          <Plus size={14} />
          Add product
        </button>
      </div>

      {/* Brand kit selector */}
      {kits.length > 1 && (
        <div className="mb-5">
          <div className="relative inline-block">
            <select
              value={selectedKitId}
              onChange={e => setSelectedKitId(e.target.value)}
              className="appearance-none bg-bg-surface border border-border-default rounded-xl px-4 py-2.5 pr-9 text-[13px] text-text-primary outline-none focus:border-accent transition-colors cursor-pointer"
            >
              {kits.map(k => (
                <option key={k.id} value={k.id}>{k.brandName}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
        </div>
      )}

      {kits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package size={36} className="text-text-muted mb-4" />
          <p className="font-semibold text-[15px] text-text-primary mb-2">No brand kits yet</p>
          <p className="font-mono text-[12px] text-text-muted mb-6">Create a brand kit first to add products</p>
          <a href="/onboarding" className="bg-accent text-black font-semibold text-sm px-6 py-3 rounded-lg">
            Create brand kit →
          </a>
        </div>
      ) : loadingProducts ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="text-accent animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package size={36} className="text-text-muted mb-4" />
          <p className="font-semibold text-[15px] text-text-primary mb-2">No products yet</p>
          <p className="font-mono text-[12px] text-text-muted mb-6">
            Add your first product for {selectedKit?.brandName ?? "this brand kit"}
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="bg-accent text-black font-semibold text-sm px-6 py-3 rounded-lg"
          >
            <Plus size={14} className="inline mr-1" />
            Add product
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(product => (
            <div
              key={product.id}
              className="bg-bg-surface border border-border-default rounded-2xl p-4 flex items-center gap-4"
            >
              {/* Image */}
              <div className="w-16 h-16 rounded-xl bg-bg-elevated border border-border-subtle shrink-0 overflow-hidden flex items-center justify-center">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package size={22} className="text-text-muted" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px] text-text-primary truncate">{product.name}</p>
                <p className="font-mono text-[11px] text-text-muted mt-0.5">
                  {product.priceLabel}
                  {product.discountPriceLabel && (
                    <span className="text-accent ml-2">→ {product.discountPriceLabel}</span>
                  )}
                  {product.category && <span className="ml-2">· {product.category}</span>}
                </p>
                <p className={`font-mono text-[10px] mt-0.5 ${product.inStock ? "text-green-500" : "text-red-400"}`}>
                  {product.inStock ? "● In stock" : "● Out of stock"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/create?mode=product&productId=${product.id}&brandKitId=${selectedKitId}`)}
                  className="inline-flex items-center gap-1.5 bg-accent text-black font-semibold text-[11px] px-3 py-1.5 rounded-lg hover:bg-accent-dim transition-colors min-h-[32px]"
                >
                  <Sparkles size={11} />
                  Generate poster
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(product)}
                  className="inline-flex items-center gap-1 bg-bg-elevated border border-border-default text-text-secondary font-medium text-[11px] px-2.5 py-1.5 rounded-lg hover:border-border-strong transition-colors min-h-[32px]"
                >
                  <Pencil size={11} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(product)}
                  disabled={deletingId === product.id}
                  className="inline-flex items-center gap-1 bg-bg-elevated border border-border-default text-red-400 font-medium text-[11px] px-2.5 py-1.5 rounded-lg hover:border-red-500/40 transition-colors min-h-[32px] disabled:opacity-50"
                >
                  {deletingId === product.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit drawer — slide-in panel */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setFormOpen(false)} />
          <div className="relative w-full max-w-md bg-bg-base h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-default shrink-0">
              <h2 className="font-semibold text-[16px] text-text-primary">
                {editingProduct ? "Edit product" : "Add product"}
              </h2>
              <button type="button" onClick={() => setFormOpen(false)} className="text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-1.5">Product name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-3 text-[14px] text-text-primary outline-none focus:border-accent transition-colors"
                  placeholder="e.g. Wireless Earbuds Pro"
                />
              </div>

              {/* Category */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-1.5">Category</label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full appearance-none bg-bg-surface border border-border-default rounded-xl px-4 py-3 pr-9 text-[14px] text-text-primary outline-none focus:border-accent transition-colors cursor-pointer"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-3 text-[14px] text-text-primary outline-none focus:border-accent transition-colors resize-none"
                  placeholder="Key features, benefits..."
                />
              </div>

              {/* Price + Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-1.5">Price *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-3 text-[14px] text-text-primary outline-none focus:border-accent transition-colors"
                    placeholder="45000"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-1.5">Currency</label>
                  <input
                    type="text"
                    maxLength={5}
                    value={form.currency}
                    onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))}
                    className="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-3 text-[14px] text-text-primary outline-none focus:border-accent transition-colors"
                    placeholder="TZS"
                  />
                </div>
              </div>

              {/* Discount price */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-1.5">
                  Discount price <span className="text-text-muted/60">(optional — for promo posters)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.discountPrice}
                  onChange={e => setForm(f => ({ ...f, discountPrice: e.target.value }))}
                  className="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-3 text-[14px] text-text-primary outline-none focus:border-accent transition-colors"
                  placeholder="32000"
                />
                {form.price && form.discountPrice && (
                  <p className="font-mono text-[10px] text-text-muted mt-1.5">
                    {formatCurrency(Number(form.price), form.currency)} → {formatCurrency(Number(form.discountPrice), form.currency)}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-1.5">Tags</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  className="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-3 text-[14px] text-text-primary outline-none focus:border-accent transition-colors"
                  placeholder="sale, new, featured (comma separated)"
                />
              </div>

              {/* In stock */}
              <div className="flex items-center justify-between bg-bg-surface border border-border-default rounded-xl px-4 py-3">
                <span className="text-[14px] text-text-primary">In stock</span>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, inStock: !f.inStock }))}
                  className={`relative w-11 h-6 rounded-full transition-all duration-200 ${form.inStock ? "bg-accent" : "bg-bg-elevated border border-border-strong"}`}
                  role="switch"
                  aria-checked={form.inStock}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-200 shadow-sm ${form.inStock ? "left-6 bg-black" : "left-1 bg-text-muted"}`} />
                </button>
              </div>

              {/* Product photos */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted block mb-1.5">
                  Product photos <span className="text-text-muted/60">(up to 5)</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formImages.map((url, i) => (
                    <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border-default">
                      <Image src={url} alt={`Photo ${i + 1}`} width={64} height={64} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white hover:bg-black/80"
                      >
                        <X size={9} />
                      </button>
                    </div>
                  ))}
                  {formImages.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-16 h-16 rounded-lg border-2 border-dashed border-border-default flex flex-col items-center justify-center text-text-muted hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
                    >
                      {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadImage(f); e.target.value = ""; }}
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-border-default flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="flex-1 bg-bg-elevated border border-border-default text-text-secondary font-medium text-[14px] py-3 rounded-xl hover:border-border-strong transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-accent text-black font-semibold text-[14px] py-3 rounded-xl hover:bg-accent-dim transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
