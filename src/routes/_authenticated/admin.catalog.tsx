import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Eye, Package, Plus, Save, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  deleteProduct,
  listProducts,
  upsertProduct,
  uploadProductImage,
} from "@/lib/cms.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AdminPage,
  AdminError,
  AdminLoading,
  Panel,
  PanelHeading,
  StatusPill,
  Toggle,
  adminInput,
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
  "Conference Equipment",
  "Promotional Merchandise",
];

function CatalogManager() {
  const list = useServerFn(listProducts);
  const save = useServerFn(upsertProduct);
  const remove = useServerFn(deleteProduct);
  const uploadImage = useServerFn(uploadProductImage);
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Product | null>(null);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [stock, setStock] = useState("All status");
  const [uploadingImage, setUploadingImage] = useState(false);
  const products = useQuery({ queryKey: ["admin-products"], queryFn: () => list({}) });
  useEffect(() => {
    const channel = supabase
      .channel("cms-products-live")
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
          price_from: Number(product.price_from) || 0,
          sale_price: product.sale_price ? Number(product.sale_price) : null,
          stock_quantity: Number(product.stock_quantity) || 0,
          sort_order: Number(product.sort_order) || 0,
          image_url: product.image_url || null,
          images: product.images?.length
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
  const filteredRows = rows.filter((row) => {
    const matchesQuery = `${row.title} ${row.subtitle}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All categories" || row.category === category;
    const matchesStock = stock === "All status" || (stock === "Active" ? row.active : !row.active);
    return matchesQuery && matchesCategory && matchesStock;
  });
  return (
    <AdminPage
      eyebrow="Catalog & inventory"
      title="Everything your customers can order."
      description="Keep products, badges, WhatsApp payloads, and storefront visibility in sync from one high-density workspace."
      action={
        <button
          type="button"
          onClick={() => setDraft({ ...blank })}
          className="inline-flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-3 text-xs font-semibold text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Add product
        </button>
      }
    >
      <Panel>
        <PanelHeading
          icon={Package}
          title="Product manager"
          detail={`${rows.length} products · ${rows.filter((row) => row.active).length} visible`}
          action={<StatusPill status="Realtime connected" />}
        />
        <div className="grid gap-3 border-b border-white/[0.08] p-4 md:grid-cols-[minmax(0,1fr)_180px_140px]">
          <label className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#1C222B] px-3 text-[#94A3B8]">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search catalog…"
              className="w-full bg-transparent py-3 text-sm text-white outline-none"
            />
          </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={adminInput}
          >
            <option>All categories</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            className={adminInput}
          >
            <option>All status</option>
            <option>Active</option>
            <option>Draft</option>
          </select>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.isPending ? (
            <AdminLoading label="Loading catalog" />
          ) : products.isError ? (
            <AdminError
              detail="The catalog could not be loaded."
              onRetry={() => void products.refetch()}
            />
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-[#98A2B3]">
              No products yet. Add the first product to populate the storefront.
            </p>
          ) : (
            filteredRows.map((row) => (
              <ProductRow
                key={row.id}
                product={row}
                onEdit={() => setDraft({ ...row })}
                onDelete={() => setDeleting(row)}
                onView={() => setViewing(row)}
              />
            ))
          )}
        </div>
      </Panel>
      {draft ? (
        <Modal
          title={draft.id ? "Edit Catalog Item" : "Add Catalog Item"}
          subtitle="Manage item parameters, pricing, and visual media."
          onClose={() => setDraft(null)}
        >
          <ProductEditor
            value={draft}
            saving={mutation.isPending}
            uploading={uploadingImage}
            onChange={setDraft}
            onSave={() => mutation.mutate(draft)}
            onCancel={() => setDraft(null)}
            onUploadImage={async (file) => {
              setUploadingImage(true);
              const toastId = toast.loading(`Uploading ${file.name}...`);
              try {
                const base64 = await fileToBase64(file);
                const { publicUrl } = await uploadImage({
                  data: {
                    filename: file.name,
                    contentType: file.type,
                    base64,
                  },
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
                toast.success(`${file.name} uploaded successfully`, { id: toastId });
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Could not upload image", {
                  id: toastId,
                });
              } finally {
                setUploadingImage(false);
              }
            }}
          />
        </Modal>
      ) : null}
      {viewing ? (
        <Modal
          title="Catalog preview"
          subtitle="Live item details"
          onClose={() => setViewing(null)}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="aspect-square overflow-hidden rounded-2xl bg-[#1C222B]">
              {viewing.image_url ? (
                <img
                  src={viewing.image_url}
                  alt={viewing.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-[#64748B]">
                  <Package className="h-10 w-10" />
                </div>
              )}
            </div>
            <div>
              <StatusPill status={viewing.active ? "Active" : "Draft"} />
              <h3 className="mt-4 text-2xl font-semibold text-white">{viewing.title}</h3>
              <p className="mt-2 text-sm text-[#94A3B8]">{viewing.subtitle}</p>
              <p className="mt-8 text-3xl font-semibold text-[#FF9500]">
                KES {viewing.price_from.toLocaleString("en-KE")}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {viewing.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-[#94A3B8]"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
      {deleting ? (
        <Modal
          title="Delete catalog item?"
          subtitle={`This will remove ${deleting.title} from the catalog.`}
          onClose={() => setDeleting(null)}
        >
          <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
            This action cannot be undone.
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-[#94A3B8]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (deleting.id) destroy.mutate(deleting.id);
                setDeleting(null);
              }}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Confirm Delete
            </button>
          </div>
        </Modal>
      ) : null}
    </AdminPage>
  );
}

function ProductRow({
  product,
  onEdit,
  onDelete,
  onView,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#1C222B] p-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#EAF7EF]">
          {product.image_url ? (
            <img src={product.image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-[#208454]">
              <Package className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{product.title}</p>
          <p className="mt-1 truncate text-xs text-[#98A2B3]">
            {product.subtitle || "No subtitle yet"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {product.badges.slice(0, 2).map((badge) => (
              <span
                key={badge}
                className="rounded bg-[#F2F4F7] px-1.5 py-0.5 text-[9px] text-[#667085]"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-[#94A3B8]">{product.category}</span>
        <span className="text-sm font-semibold text-[#FF9500]">
          KES {product.price_from.toLocaleString("en-KE")}
        </span>
      </div>
      <StatusPill status={product.active ? "Active" : "Inactive"} />
      <div className="mt-4 flex items-center gap-1">
        <button
          type="button"
          onClick={onView}
          className="rounded-lg border border-white/10 p-2 text-[#94A3B8] hover:text-white"
          aria-label={`View ${product.title}`}
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="min-h-10 rounded-lg border border-white/10 px-2.5 py-2 text-[10px] font-semibold text-[#94A3B8] hover:border-[#FF7A00] hover:text-[#FF9500] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A00]"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${product.title}`}
          className="rounded-lg p-2 text-[#98A2B3] hover:bg-[#FDECEE] hover:text-[#C3121F]"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ProductEditor({
  value,
  saving,
  uploading,
  onChange,
  onSave,
  onCancel,
  onUploadImage,
}: {
  value: Product;
  saving: boolean;
  uploading: boolean;
  onChange: (product: Product) => void;
  onSave: () => void;
  onCancel: () => void;
  onUploadImage: (file: File) => Promise<void>;
}) {
  const set = (key: keyof Product, next: string | number | boolean | null | string[]) =>
    onChange({ ...value, [key]: next });
  return (
    <div className="bg-[#161B22] p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{value.id ? "Edit product" : "New product"}</p>
          <p className="mt-1 text-xs text-[#98A2B3]">Product content and WhatsApp order behavior</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-[#94A3B8]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF7A00] px-3 py-2 text-xs font-semibold text-[#0F1217] disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </div>
      {/* Images Section */}
      <div className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Product images</p>
            <p className="mt-1 text-xs text-[#94A3B8]">
              Upload multiple product images ({value.images.length} uploaded)
            </p>
          </div>
        </div>

        {/* Uploaded Images Grid */}
        {value.images.length > 0 && (
          <div className="mb-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {value.images.map((img, idx) => (
              <div key={idx} className="group relative overflow-hidden rounded-lg">
                <img
                  src={img}
                  alt={`Product image ${idx + 1}`}
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newImages = value.images.filter((_, i) => i !== idx);
                    onChange({ ...value, images: newImages });
                    toast.success("Image removed");
                  }}
                  className="absolute right-2 top-2 hidden rounded-lg bg-red-500/90 p-1.5 text-white transition hover:bg-red-600 group-hover:flex"
                  aria-label="Delete image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Area */}
        <label
          className="block cursor-pointer rounded-2xl border border-dashed border-white/15 bg-[#1C222B] p-6 transition hover:border-[#FF7A00]"
          style={{
            pointerEvents: uploading ? "none" : "auto",
            opacity: uploading ? 0.5 : 1,
          }}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="h-8 w-8 text-[#64748B]" />
            <strong className="mt-2 block text-sm text-white">Add more images</strong>
            <small className="mt-1 block text-xs text-[#94A3B8]">
              {uploading ? "Uploading…" : "Drag and drop or click to browse"}
            </small>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              const files = event.currentTarget.files;
              if (files) void uploadFiles(Array.from(files), onUploadImage);
            }}
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Field label="Product title">
          <input
            value={value.title}
            onChange={(event) => set("title", event.target.value)}
            className={adminInput}
            placeholder="Premium cotton tee"
          />
        </Field>
        <Field label="SKU">
          <input
            value={value.sku}
            onChange={(event) => set("sku", event.target.value)}
            className={adminInput}
            placeholder="TRIAD-POLO-001"
          />
        </Field>
        <Field label="Category">
          <select
            value={value.category}
            onChange={(event) => set("category", event.target.value)}
            className={adminInput}
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </Field>
        <Field label="Price from (KES)">
          <input
            type="number"
            value={value.price_from}
            onChange={(event) => set("price_from", Number(event.target.value))}
            className={adminInput}
          />
        </Field>
        <Field label="Sale price (KES)">
          <input
            type="number"
            value={value.sale_price ?? ""}
            onChange={(event) =>
              set("sale_price", event.target.value ? Number(event.target.value) : null)
            }
            className={adminInput}
            placeholder="Optional"
          />
        </Field>
        <Field label="Stock quantity">
          <input
            type="number"
            value={value.stock_quantity}
            onChange={(event) => set("stock_quantity", Number(event.target.value))}
            className={adminInput}
          />
        </Field>
        <Field label="Sort order">
          <input
            type="number"
            value={value.sort_order}
            onChange={(event) => set("sort_order", Number(event.target.value))}
            className={adminInput}
          />
        </Field>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Subtitle / highlight">
          <input
            value={value.subtitle}
            onChange={(event) => set("subtitle", event.target.value)}
            className={adminInput}
            placeholder="Comfortable fabric with vibrant logo print"
          />
        </Field>
        <Field label="Branding badges">
          <input
            value={value.badges.join(", ")}
            onChange={(event) =>
              set(
                "badges",
                event.target.value
                  .split(",")
                  .map((badge) => badge.trim())
                  .filter(Boolean),
              )
            }
            className={adminInput}
            placeholder="Screen print, Embroidery"
          />
        </Field>
        <Field label="Image URL">
          <div className="flex gap-2">
            <input
              value={value.image_url ?? ""}
              onChange={(event) => set("image_url", event.target.value || null)}
              className={adminInput}
              placeholder="https://…"
            />
            {value.image_url ? (
              <a
                href={value.image_url}
                target="_blank"
                rel="noreferrer"
                className="grid shrink-0 place-items-center rounded-xl border border-[#D0D5DD] px-3 text-[#667085]"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </Field>
        <Field label="WhatsApp payload">
          <textarea
            value={value.whatsapp_payload}
            onChange={(event) => set("whatsapp_payload", event.target.value)}
            className={`${adminInput} min-h-20 resize-y`}
            placeholder="Hi Triad, I would like a quote for…"
          />
        </Field>
        <Field label="Description / features">
          <textarea
            value={value.description}
            onChange={(event) => set("description", event.target.value)}
            className={`${adminInput} min-h-24 resize-y`}
            placeholder="Item features, materials, and production details…"
          />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-xs text-[#667085]">
          Visible{" "}
          <Toggle
            checked={value.active}
            label="Product visible"
            onChange={(checked) => set("active", checked)}
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-[#667085]">
          Featured{" "}
          <Toggle
            checked={value.featured}
            label="Product featured"
            onChange={(checked) => set("featured", checked)}
          />
        </label>
      </div>
    </div>
  );
}

async function uploadFiles(files: File[], upload: (file: File) => Promise<void>) {
  for (const file of files) await upload(file);
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100svh-1.5rem)] max-w-3xl overscroll-contain overflow-y-auto rounded-xl border-white/[0.12] bg-[#161B22] p-0 text-white shadow-2xl sm:max-h-[92vh] [&>button]:right-5 [&>button]:top-5 [&>button]:text-[#94A3B8] [&>button]:hover:text-white">
        <DialogHeader className="border-b border-white/[0.08] p-5 pr-16 text-left md:p-6 md:pr-16">
          <DialogTitle className="text-xl font-semibold text-white">{title}</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-[#94A3B8]">{subtitle}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#667085]">
        {label}
      </span>
      {children}
    </label>
  );
}
