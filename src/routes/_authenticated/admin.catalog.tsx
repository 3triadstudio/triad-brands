import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Eye, Package, Plus, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { deleteProduct, listProducts, upsertProduct, uploadAsset } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminPage,
  AdminError,
  AdminLoading,
  EmptyState,
  Field,
  Modal,
  ModalFooter,
  Panel,
  PanelHeading,
  StatusPill,
  Toggle,
  inputClass,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/catalog")({
  component: CatalogManager,
});

type Product = {
  id?: string;
  title: string;
  sku: string;
  subtitle: string;
  description: string;
  category: string;
  badges: string[];
  price_from: number;
  sale_price: number | null;
  stock_quantity: number;
  image_url: string | null;
  images: string[];
  whatsapp_payload: string;
  featured: boolean;
  active: boolean;
  sort_order: number;
};

const blank: Product = {
  title: "",
  sku: "",
  subtitle: "",
  description: "",
  category: "Apparel",
  badges: [],
  price_from: 0,
  sale_price: null,
  stock_quantity: 0,
  image_url: null,
  images: [],
  whatsapp_payload: "",
  featured: false,
  active: true,
  sort_order: 0,
};

const categories = [
  "Apparel",
  "Drinkware & Office",
  "Event & Exhibition",
  "Promotional Merchandise",
];

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

function CatalogManager() {
  const list = useServerFn(listProducts);
  const save = useServerFn(upsertProduct);
  const remove = useServerFn(deleteProduct);
  const upload = useServerFn(uploadAsset);
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Product | null>(null);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [uploading, setUploading] = useState(false);

  const products = useQuery({ queryKey: ["admin-products"], queryFn: () => list({}) });

  useEffect(() => {
    const channel = supabase
      .channel("admin-products-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-products"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  const mutation = useMutation({
    mutationFn: (product: Product) =>
      save({
        data: {
          ...product,
          images: product.images.length
            ? product.images
            : product.image_url
              ? [product.image_url]
              : [],
        } as never,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setDraft(null);
      toast.success("Product saved");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save product"),
  });
  const destroy = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product removed");
    },
    onError: () => toast.error("Could not remove product"),
  });

  const rows = ((products.data ?? []) as Product[]).map((row) => ({
    ...row,
    images: row.images?.length ? row.images : row.image_url ? [row.image_url] : [],
  }));
  const filtered = rows.filter((row) => {
    const matchesQuery = `${row.title} ${row.subtitle}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All categories" || row.category === category;
    return matchesQuery && matchesCategory;
  });

  async function uploadImage(file: File) {
    setUploading(true);
    const toastId = toast.loading(`Uploading ${file.name}…`);
    try {
      const base64 = await fileToBase64(file);
      const { publicUrl } = await upload({
        data: { folder: "products", filename: file.name, contentType: file.type, base64 },
      });
      setDraft((current) =>
        current
          ? {
              ...current,
              images: [...current.images, publicUrl],
              image_url: current.image_url || publicUrl,
            }
          : current,
      );
      toast.success("Image uploaded", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload image", {
        id: toastId,
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <AdminPage
      eyebrow="Catalog"
      title="Everything your customers can order."
      description="Products, pricing, badges, and storefront visibility, synced live."
      action={
        <button
          type="button"
          onClick={() => setDraft({ ...blank })}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#111827] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#1F2937]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add product
        </button>
      }
    >
      <Panel>
        <PanelHeading
          icon={Package}
          title="Product manager"
          detail={`${rows.length} products · ${rows.filter((r) => r.active).length} visible`}
          action={<StatusPill status="Realtime connected" />}
        />
        <div className="grid gap-3 border-b border-[#F3F4F6] p-4 md:grid-cols-[minmax(0,1fr)_200px]">
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 text-[#6B7280]">
            <Search className="h-4 w-4" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search catalog…"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
            />
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            <option>All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        {products.isPending ? (
          <AdminLoading label="Loading catalog" />
        ) : products.isError ? (
          <AdminError
            detail="The catalog could not be loaded."
            onRetry={() => void products.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No products yet"
            detail="Add the first product to populate the storefront."
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="No products match" detail="Try a different search term or category." />
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((row) => (
              <article key={row.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#F3F4F6]">
                    {row.image_url ? (
                      <img src={row.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-[#9CA3AF]">
                        <Package className="h-5 w-5" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#111827]">{row.title}</p>
                    <p className="mt-0.5 truncate text-xs text-[#6B7280]">
                      {row.subtitle || "No subtitle yet"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-[#9CA3AF]">{row.category}</span>
                  <span className="text-sm font-semibold text-[#ED1D2B]">
                    KES {row.price_from.toLocaleString("en-KE")}
                  </span>
                </div>
                <div className="mt-3">
                  <StatusPill status={row.active ? "Active" : "Inactive"} />
                </div>
                <div className="mt-4 flex items-center gap-1 border-t border-[#F3F4F6] pt-3">
                  <button
                    type="button"
                    onClick={() => setViewing(row)}
                    className="rounded-lg p-2 text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]"
                    aria-label={`View ${row.title}`}
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft({ ...row })}
                    className="min-h-9 rounded-lg border border-[#E5E7EB] px-3 text-[10px] font-semibold text-[#111827] hover:border-[#ED1D2B] hover:text-[#ED1D2B]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(row)}
                    className="ml-auto rounded-lg p-2 text-[#9CA3AF] hover:bg-[#FEF2F2] hover:text-[#991B1B]"
                    aria-label={`Delete ${row.title}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      {draft ? (
        <Modal
          title={draft.id ? "Edit product" : "Add product"}
          subtitle="Manage item details, pricing, and media."
          onClose={() => setDraft(null)}
        >
          <div className="p-5 md:p-6">
            <div className="mb-5">
              <p className="text-sm font-semibold text-[#111827]">Product images</p>
              <p className="mt-1 text-xs text-[#6B7280]">{draft.images.length} uploaded</p>
              {draft.images.length > 0 ? (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {draft.images.map((img, idx) => (
                    <div key={idx} className="group relative overflow-hidden rounded-lg">
                      <img src={img} alt="" className="aspect-square w-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((c) =>
                            c ? { ...c, images: c.images.filter((_, i) => i !== idx) } : c,
                          )
                        }
                        className="absolute right-1 top-1 hidden rounded-lg bg-red-500/90 p-1 text-white group-hover:flex"
                        aria-label="Remove image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <label className="mt-3 block cursor-pointer rounded-xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] p-4 text-center hover:border-[#ED1D2B]">
                <Upload className="mx-auto h-5 w-5 text-[#9CA3AF]" aria-hidden="true" />
                <p className="mt-1.5 text-xs font-semibold text-[#111827]">
                  {uploading ? "Uploading…" : "Add images"}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    const files = Array.from(e.currentTarget.files ?? []);
                    files.forEach((f) => void uploadImage(f));
                  }}
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title">
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="SKU">
                <input
                  value={draft.sku}
                  onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Category">
                <select
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  className={inputClass}
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Price from (KES)">
                <input
                  type="number"
                  value={draft.price_from}
                  onChange={(e) => setDraft({ ...draft, price_from: Number(e.target.value) })}
                  className={inputClass}
                />
              </Field>
              <Field label="Sale price (KES)">
                <input
                  type="number"
                  value={draft.sale_price ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      sale_price: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className={inputClass}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Stock quantity">
                <input
                  type="number"
                  value={draft.stock_quantity}
                  onChange={(e) => setDraft({ ...draft, stock_quantity: Number(e.target.value) })}
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="mt-4 grid gap-4">
              <Field label="Subtitle">
                <input
                  value={draft.subtitle}
                  onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Badges (comma separated)">
                <input
                  value={draft.badges.join(", ")}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      badges: e.target.value
                        .split(",")
                        .map((b) => b.trim())
                        .filter(Boolean),
                    })
                  }
                  className={inputClass}
                  placeholder="Screen print, Embroidery"
                />
              </Field>
              <Field label="WhatsApp payload">
                <textarea
                  value={draft.whatsapp_payload}
                  onChange={(e) => setDraft({ ...draft, whatsapp_payload: e.target.value })}
                  className={`${inputClass} min-h-20 resize-y`}
                  placeholder="Hi Triad, I would like a quote for…"
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  className={`${inputClass} min-h-24 resize-y`}
                />
              </Field>
            </div>
            <div className="mt-5 flex flex-wrap gap-5 border-t border-[#F3F4F6] pt-5">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#6B7280]">
                Visible
                <Toggle
                  checked={draft.active}
                  onChange={(v) => setDraft({ ...draft, active: v })}
                  label="Product visible"
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-[#6B7280]">
                Featured
                <Toggle
                  checked={draft.featured}
                  onChange={(v) => setDraft({ ...draft, featured: v })}
                  label="Product featured"
                />
              </label>
            </div>
          </div>
          <ModalFooter
            onCancel={() => setDraft(null)}
            onSave={() => mutation.mutate(draft)}
            saving={mutation.isPending}
          />
        </Modal>
      ) : null}

      {viewing ? (
        <Modal
          title="Catalog preview"
          subtitle="Live item details"
          onClose={() => setViewing(null)}
        >
          <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
            <div className="aspect-square overflow-hidden rounded-xl bg-[#F3F4F6]">
              {viewing.image_url ? (
                <img
                  src={viewing.image_url}
                  alt={viewing.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-[#9CA3AF]">
                  <Package className="h-10 w-10" aria-hidden="true" />
                </div>
              )}
            </div>
            <div>
              <StatusPill status={viewing.active ? "Active" : "Draft"} />
              <h3 className="mt-4 text-2xl font-semibold text-[#111827]">{viewing.title}</h3>
              <p className="mt-2 text-sm text-[#6B7280]">{viewing.subtitle}</p>
              <p className="mt-8 text-3xl font-semibold text-[#ED1D2B]">
                KES {viewing.price_from.toLocaleString("en-KE")}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {viewing.badges.map((b) => (
                  <span
                    key={b}
                    className="rounded-full border border-[#E5E7EB] px-3 py-1 text-xs text-[#6B7280]"
                  >
                    {b}
                  </span>
                ))}
              </div>
              {viewing.image_url ? (
                <a
                  href={viewing.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#111827]"
                >
                  Open full image <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>
        </Modal>
      ) : null}

      {deleting ? (
        <Modal
          title="Delete product?"
          subtitle={`This will remove ${deleting.title} from the catalog.`}
          onClose={() => setDeleting(null)}
        >
          <div className="p-5 md:p-6">
            <p className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2 border-t border-[#F3F4F6] p-5 md:p-6">
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="min-h-10 rounded-xl border border-[#E5E7EB] px-4 text-xs font-semibold text-[#111827] hover:bg-[#F9FAFB]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (deleting.id) destroy.mutate(deleting.id);
                setDeleting(null);
              }}
              className="min-h-10 rounded-xl bg-[#991B1B] px-4 text-xs font-semibold text-white hover:bg-[#7F1D1D]"
            >
              Confirm delete
            </button>
          </div>
        </Modal>
      ) : null}
    </AdminPage>
  );
}
