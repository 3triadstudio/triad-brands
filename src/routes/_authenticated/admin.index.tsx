import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowUpRight,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  LayoutTemplate,
  MessageCircle,
  MousePointer2,
  Package,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Smartphone,
  Tablet,
  Trash2,
  Type,
  Undo2,
  Redo2,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { listLeads } from "@/lib/admin.functions";
import {
  getDashboardMetrics,
  getVercelAnalytics,
  getPageDocument,
  getSettings,
  deleteSiteAsset,
  duplicatePageDocument,
  deleteSlide,
  listSiteAssets,
  listSections,
  listSlides,
  listWhatsappLeads,
  listPageRevisions,
  publishPageDocument,
  restorePageRevision,
  savePageDraft,
  saveSavedSection,
  saveSetting,
  upsertSlide,
  uploadHeroSlideImage,
  uploadSiteAsset,
} from "@/lib/cms.functions";
import { blockCatalog, getDefaultPageDocument, type PageId } from "@/lib/page-editor";
import type { PageBlock, PageBlockItem } from "@/lib/page-editor";
import {
  AdminPage,
  AdminError,
  AdminLoading,
  MetricCard,
  Panel,
  PanelHeading,
  StatusPill,
  Toggle,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/")({ component: OverviewDashboard });

type SelectedElement = {
  selector: string;
  tag: string;
  text: string;
  image: string | null;
  blockKey?: string | null;
  fieldKey?: string | null;
  href?: string | null;
};
type Viewport = "desktop" | "tablet" | "mobile";
type Block = {
  id: string;
  name: string;
  key: string;
  kind?: string;
  is_visible: boolean;
  sort_order: number;
  local?: boolean;
  children?: PageBlock[];
};
type HeroSlide = {
  id?: string;
  eyebrow: string;
  headline: string;
  subtext: string;
  cta_label: string;
  cta_href: string;
  image_url: string | null;
  overlay_opacity: number;
  active: boolean;
  sort_order: number;
};
type EditorSnapshot = {
  blocks: Block[];
  draftEdits: Record<string, Record<string, string>>;
  draftDesigns: Record<string, Record<string, string>>;
  categoryItems: PageBlockItem[];
};
type Activity = {
  id: string;
  name: string;
  detail: string;
  status: string;
  created_at: string;
  kind: "form" | "whatsapp";
};
type FormLead = {
  id: string;
  name: string | null;
  company: string | null;
  service: string | null;
  email: string;
  status: string;
  created_at: string;
};
type WhatsappLead = {
  id: string;
  name: string | null;
  product_title: string | null;
  phone: string;
  status: string;
  created_at: string;
};

const pagePath = (pageId: PageId) =>
  ({
    home: "/",
    shop: "/shop",
    solutions: "/solutions",
    about: "/about",
    contact: "/contact",
    category: "/category/apparel",
    product: "/shop",
    work: "/about",
    privacy: "/privacy-policy",
    terms: "/terms",
    cookies: "/cookies",
  })[pageId];

function OverviewDashboard() {
  const metricsFn = useServerFn(getDashboardMetrics);
  const vercelAnalyticsFn = useServerFn(getVercelAnalytics);
  const [rangeDays, setRangeDays] = useState(30);
  const metrics = useQuery({
    queryKey: ["dashboard-metrics", rangeDays],
    queryFn: () => metricsFn({ data: { days: rangeDays } }),
    refetchInterval: 60_000,
  });
  const vercelAnalytics = useQuery({
    queryKey: ["vercel-web-analytics"],
    queryFn: () => vercelAnalyticsFn({}),
    refetchInterval: 5 * 60_000,
  });
  if (metrics.isPending) {
    return (
      <AdminPage
        eyebrow="Overview"
        title="Your storefront at a glance."
        description="Loading tracked storefront signals…"
      >
        <Panel>
          <AdminLoading label="Loading storefront signals" />
        </Panel>
      </AdminPage>
    );
  }

  if (metrics.isError) {
    return (
      <AdminPage
        eyebrow="Overview"
        title="Analytics are temporarily unavailable."
        description="The dashboard could not load tracked storefront signals. Try again without leaving this page."
        action={<StatusPill status="Unavailable" />}
      >
        <Panel>
          <AdminError
            detail={
              metrics.error instanceof Error
                ? metrics.error.message
                : "The dashboard could not load tracked storefront signals."
            }
            onRetry={() => void metrics.refetch()}
          />
        </Panel>
      </AdminPage>
    );
  }

  const metric = metrics.data ?? {
    totalClicks: 0,
    totalLeads: 0,
    conversionRate: 0,
    topCategory: { name: "No data" },
    whatsappClicks: 0,
    telClicks: 0,
    pendingLeads: 0,
    activeProducts: 0,
    velocity: [],
  };
  const vercelTrend = vercelAnalytics.data?.configured ? (vercelAnalytics.data.trend ?? []) : [];
  const downloadBusinessSignals = () => {
    const header = "day,clicks,leads";
    const rows = metric.velocity.map((day) => `${day.day},${day.clicks},${day.leads}`);
    const csv = [header, ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `triad-business-signals-${rangeDays}d.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <AdminPage
      eyebrow="Overview"
      title="Your storefront at a glance."
      description="Monitor real customer signals recorded by the storefront and keep content moving."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="overview-range">
            Analytics range
          </label>
          <select
            id="overview-range"
            value={rangeDays}
            onChange={(event) => setRangeDays(Number(event.target.value))}
            className="min-h-11 rounded-lg border border-[#CBD3DF] bg-white px-3 text-xs font-semibold text-[#172033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            type="button"
            onClick={downloadBusinessSignals}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#CBD3DF] bg-white px-3 text-xs font-semibold text-[#172033] transition-colors hover:bg-[#F1F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" /> Export CSV
          </button>
          <StatusPill status="Tracked signals" />
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tracked clicks"
          value={metric.totalClicks.toLocaleString()}
          detail={`Last ${rangeDays} days · storefront events`}
          icon={MousePointer2}
          tone="dark"
        />
        <MetricCard
          label="Lead enquiries"
          value={metric.totalLeads.toLocaleString()}
          detail="Forms and WhatsApp"
          icon={MessageCircle}
          tone="green"
        />
        <MetricCard
          label="Top category"
          value={metric.topCategory.name}
          detail="By tracked activity"
          icon={Palette}
          tone="lilac"
        />
        <MetricCard
          label="Won rate"
          value={`${metric.conversionRate}%`}
          detail="From recorded leads"
          icon={Check}
          tone="cream"
        />
      </div>
      <Panel>
        <PanelHeading
          icon={BarChart3}
          title="Vercel Web Analytics"
          detail="Production page views and visitors over the last 30 days"
          action={
            <StatusPill
              status={
                vercelAnalytics.isPending
                  ? "Loading"
                  : vercelAnalytics.data?.configured
                    ? "Connected"
                    : "Not configured"
              }
            />
          }
        />
        {vercelAnalytics.isPending ? (
          <div className="grid gap-3 p-5 sm:grid-cols-2" aria-label="Loading Vercel analytics">
            <div className="h-20 animate-pulse rounded-lg bg-[#F1F5F9]" />
            <div className="h-20 animate-pulse rounded-lg bg-[#F1F5F9]" />
          </div>
        ) : vercelAnalytics.isError ? (
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm text-[#991B1B]">
            <p>Vercel Analytics could not be loaded. Check the API token and project access.</p>
            <button
              type="button"
              onClick={() => void vercelAnalytics.refetch()}
              className="min-h-11 rounded-lg border border-[#FECACA] px-3 text-xs font-semibold text-[#991B1B] hover:bg-[#FFF1F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
            >
              Retry
            </button>
          </div>
        ) : !vercelAnalytics.data?.configured ? (
          <div className="p-5 text-sm text-[#526079]">
            Add{" "}
            <code className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-xs">VERCEL_ACCESS_TOKEN</code>{" "}
            and{" "}
            <code className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-xs">VERCEL_PROJECT_ID</code> to
            the server environment to connect Web Analytics. No placeholder values are shown.
          </div>
        ) : (
          <div className="grid gap-5 p-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <div className="rounded-lg border border-[#E2E7EF] bg-[#F8FAFC] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#526079]">
                  Page views
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-[#172033]">
                  {vercelAnalytics.data.pageviews.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-[#E2E7EF] bg-[#F8FAFC] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#526079]">
                  Visitors
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-[#172033]">
                  {vercelAnalytics.data.visitors.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="min-w-0">
              {vercelTrend.length ? (
                <div className="flex h-28 items-end gap-1.5" aria-label="Daily page views">
                  {vercelTrend.map((day) => {
                    const peak = Math.max(...vercelTrend.map((item) => item.pageviews), 1);
                    return (
                      <div
                        key={day.day}
                        className="group flex h-full min-w-0 flex-1 flex-col justify-end"
                      >
                        <div
                          className="w-full rounded-t bg-[#D94801] transition-[height] group-hover:bg-[#B93800]"
                          style={{ height: `${Math.max((day.pageviews / peak) * 100, 4)}%` }}
                          title={`${day.day}: ${day.pageviews.toLocaleString()} page views`}
                        />
                        <span className="mt-2 truncate text-center text-[9px] text-[#64748B]">
                          {day.day.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[#526079]">
                  No Vercel page-view data is available for this range.
                </p>
              )}
            </div>
            <div className="grid gap-3 border-t border-[#E2E7EF] pt-5 lg:col-span-2 lg:grid-cols-3">
              {[
                ["Top pages", vercelAnalytics.data.topPages ?? []],
                ["Referrers", vercelAnalytics.data.referrers ?? []],
                ["Devices", vercelAnalytics.data.devices ?? []],
              ].map(([title, items]) => (
                <div key={title as string} className="rounded-lg border border-[#E2E7EF] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#526079]">
                    {title as string}
                  </p>
                  {(items as Array<{ label: string; value: number }>).length ? (
                    <div className="mt-3 space-y-2">
                      {(items as Array<{ label: string; value: number }>).map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="min-w-0 truncate text-[#526079]">{item.label}</span>
                          <span className="shrink-0 font-semibold tabular-nums text-[#172033]">
                            {item.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-[#64748B]">No data available.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel className="overflow-hidden">
          <PanelHeading
            icon={BarChart3}
            title="Storefront activity"
            detail="Clicks and enquiries over the last seven days"
          />
          <div className="p-5 md:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-semibold tracking-[-0.05em] text-[#0E1331]">
                  {metric.totalClicks.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-[#718096]">total customer signals</p>
              </div>
              <Link
                to="/admin/builder"
                className="inline-flex min-h-11 items-center rounded-lg bg-[#172033] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#2A3853] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
              >
                Open builder
              </Link>
            </div>
            <div className="mt-7 grid h-36 grid-cols-7 items-end gap-2 sm:gap-4">
              {metric.velocity.map((day) => {
                const peak = Math.max(...metric.velocity.map((item) => item.clicks), 1);
                const height = Math.max((day.clicks / peak) * 100, day.clicks ? 12 : 4);
                return (
                  <div
                    key={day.day}
                    className="flex h-full flex-col items-center justify-end gap-2"
                  >
                    <div
                      className="w-full max-w-10 rounded-t-lg bg-[#B9DDF8] transition-all hover:bg-[#ED1D2B]"
                      style={{ height: `${height}%` }}
                      title={`${day.clicks} clicks, ${day.leads} leads`}
                    />
                    <span className="text-[10px] text-[#94A3B8]">{day.day.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
        <Panel>
          <PanelHeading
            icon={LayoutTemplate}
            title="Publishing workspace"
            detail="Edit pages and manage live content"
          />
          <div className="p-5">
            <p className="text-sm leading-6 text-[#718096]">
              Open the visual page builder to edit content in context.
            </p>
            <Link
              to="/admin/builder"
              className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#D94801] px-4 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#B93800] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
            >
              Open Page Builder
            </Link>
          </div>
        </Panel>
        <Panel className="xl:col-span-2">
          <PanelHeading
            icon={Package}
            title="Catalog status"
            detail="Current storefront inventory"
          />
          <div className="p-5">
            <p className="text-3xl font-semibold text-[#0E1331]">{metric.activeProducts}</p>
            <p className="mt-2 text-sm text-[#718096]">active products visible to customers</p>
            <Link
              to="/admin/catalog"
              className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-[#CBD3DF] px-4 py-3 text-xs font-semibold text-[#172033] transition-colors hover:bg-[#F1F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
            >
              Manage Catalog
            </Link>
          </div>
        </Panel>
      </div>
    </AdminPage>
  );
}

export function VisualCmsWorkspace({ showOverview = false }: { showOverview?: boolean }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const metricsFn = useServerFn(getDashboardMetrics);
  const sectionsFn = useServerFn(listSections);
  const pageDocumentFn = useServerFn(getPageDocument);
  const getSettingsFn = useServerFn(getSettings);
  const listPageRevisionsFn = useServerFn(listPageRevisions);
  const restorePageRevisionFn = useServerFn(restorePageRevision);
  const listSiteAssetsFn = useServerFn(listSiteAssets);
  const deleteSiteAssetFn = useServerFn(deleteSiteAsset);
  const listSlidesFn = useServerFn(listSlides);
  const saveSlideFn = useServerFn(upsertSlide);
  const deleteSlideFn = useServerFn(deleteSlide);
  const uploadHeroSlideImageFn = useServerFn(uploadHeroSlideImage);
  const duplicatePageDocumentFn = useServerFn(duplicatePageDocument);
  const uploadSiteAssetFn = useServerFn(uploadSiteAsset);
  const savePageDraftFn = useServerFn(savePageDraft);
  const saveSavedSectionFn = useServerFn(saveSavedSection);
  const saveSettingFn = useServerFn(saveSetting);
  const publishPageDocumentFn = useServerFn(publishPageDocument);
  const listLeadsFn = useServerFn(listLeads);
  const listWhatsappLeadsFn = useServerFn(listWhatsappLeads);
  const queryClient = useQueryClient();
  const metrics = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => metricsFn({ data: { days: 30 } }),
    refetchInterval: 60_000,
  });
  const sections = useQuery({ queryKey: ["admin-sections"], queryFn: () => sectionsFn({}) });
  const heroSlides = useQuery({ queryKey: ["admin-slides"], queryFn: () => listSlidesFn({}) });
  const [pageId, setPageId] = useState<PageId>("home");
  const pageDocument = useQuery({
    queryKey: ["admin-page-document", pageId],
    queryFn: () => pageDocumentFn({ data: { pageId } }),
  });
  const globalSettings = useQuery({
    queryKey: ["admin-settings-for-builder"],
    queryFn: () => getSettingsFn({}),
  });
  const mediaAssets = useQuery({
    queryKey: ["admin-site-assets"],
    queryFn: () => listSiteAssetsFn({}),
  });
  const revisions = useQuery({
    queryKey: ["admin-page-revisions", pageId],
    queryFn: () => listPageRevisionsFn({ data: { pageId } }),
  });
  const pageRecord = pageDocument.data as
    { draft?: unknown; draft_revision?: number } | null | undefined;
  const formLeads = useQuery({
    queryKey: ["dashboard-form-leads"],
    queryFn: () => listLeadsFn({}),
  });
  const whatsappLeads = useQuery({
    queryKey: ["dashboard-whatsapp-leads"],
    queryFn: () => listWhatsappLeadsFn({}),
  });
  const [selected, setSelected] = useState<SelectedElement | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"content" | "design">("content");
  const [previewKey, setPreviewKey] = useState(0);
  const [uploadingCategoryIndex, setUploadingCategoryIndex] = useState<number | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [structureOpen, setStructureOpen] = useState(true);
  const [blockPickerOpen, setBlockPickerOpen] = useState(false);
  const [draftDirty, setDraftDirty] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [draftEdits, setDraftEdits] = useState<Record<string, Record<string, string>>>({});
  const [draftDesigns, setDraftDesigns] = useState<Record<string, Record<string, string>>>({});
  const [history, setHistory] = useState<{ past: EditorSnapshot[]; future: EditorSnapshot[] }>({
    past: [],
    future: [],
  });
  const [categoryItems, setCategoryItems] = useState<PageBlockItem[]>([
    {
      id: "apparel",
      label: "Apparel & Wearables",
      description: "Polos, T-shirts, hoodies, caps",
      href: "/solutions",
      buttonLabel: "Browse",
    },
    {
      id: "drinkware",
      label: "Drinkware & Office",
      description: "Mugs, flasks, notebooks, pens",
      href: "/solutions",
      buttonLabel: "Browse",
    },
    {
      id: "event",
      label: "Event & Exhibition",
      description: "Banners, backdrops, podiums, flags",
      href: "/solutions",
      buttonLabel: "Browse",
    },
    {
      id: "promo",
      label: "Promotional Merchandise",
      description: "Keychains, lanyards, tote bags",
      href: "/solutions",
      buttonLabel: "Browse",
    },
  ]);
  const [heroItems, setHeroItems] = useState<PageBlockItem[]>([]);
  const [heroSlideDrafts, setHeroSlideDrafts] = useState<Record<string, HeroSlide>>({});
  const [pageSeo, setPageSeo] = useState<{
    title: string;
    description: string;
    canonical: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    twitterCard: "summary" | "summary_large_image";
  }>({
    title: "",
    description: "",
    canonical: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    twitterCard: "summary_large_image",
  });

  const snapshot = (): EditorSnapshot => ({
    blocks,
    draftEdits,
    draftDesigns,
    categoryItems,
  });
  const remember = () => {
    setHistory((current) => ({
      past: [...current.past, snapshot()].slice(-50),
      future: [],
    }));
  };
  const restore = (next: EditorSnapshot) => {
    setBlocks(next.blocks);
    setDraftEdits(next.draftEdits);
    setDraftDesigns(next.draftDesigns);
    setCategoryItems(next.categoryItems);
    setDraftDirty(true);
  };
  const undo = () => {
    const previous = history.past.at(-1);
    if (!previous) return;
    const current = snapshot();
    restore(previous);
    setHistory({
      past: history.past.slice(0, -1),
      future: [current, ...history.future].slice(0, 50),
    });
  };
  const redo = () => {
    const next = history.future[0];
    if (!next) return;
    const current = snapshot();
    restore(next);
    setHistory({
      past: [...history.past, current].slice(-50),
      future: history.future.slice(1),
    });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    if (sections.data) setBlocks((sections.data as Block[]).map((section) => ({ ...section })));
  }, [sections.data]);

  useEffect(() => {
    const document = pageRecord?.draft as
      | {
          blocks?: {
            id: string;
            label: string;
            visible: boolean;
            content?: Record<string, string>;
            design?: Record<string, string>;
            items?: PageBlockItem[];
            children?: PageBlock[];
          }[];
        }
      | undefined;
    if (!document?.blocks?.length) return;
    setBlocks(
      document.blocks.map((block, sort_order) => ({
        id: block.id,
        key: block.id,
        kind: (block as { kind?: string }).kind ?? block.id,
        name: block.label,
        is_visible: block.visible,
        sort_order,
        children: block.children ?? [],
      })),
    );
    setDraftEdits(
      Object.fromEntries(document.blocks.map((block) => [block.id, block.content ?? {}])),
    );
    setDraftDesigns(
      Object.fromEntries(document.blocks.map((block) => [block.id, block.design ?? {}])),
    );
    const categories = document.blocks.find((block) => block.id === "categories");
    if (categories?.items?.length) setCategoryItems(categories.items);
    const hero = document.blocks.find((block) => block.id === "hero");
    if (hero?.items?.length) setHeroItems(hero.items);
    const documentSeo = (document as { seo?: Partial<typeof pageSeo> }).seo;
    setPageSeo({
      title: documentSeo?.title ?? "",
      description: documentSeo?.description ?? "",
      canonical: documentSeo?.canonical ?? "",
      ogTitle: documentSeo?.ogTitle ?? "",
      ogDescription: documentSeo?.ogDescription ?? "",
      ogImage: documentSeo?.ogImage ?? "",
      twitterCard: documentSeo?.twitterCard === "summary" ? "summary" : "summary_large_image",
    });
  }, [pageRecord]);

  useEffect(() => {
    if (!heroSlides.data) return;
    setHeroSlideDrafts(
      Object.fromEntries(
        (heroSlides.data as HeroSlide[]).map((slide) => [
          slide.id ?? crypto.randomUUID(),
          { ...slide },
        ]),
      ),
    );
  }, [heroSlides.data]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.source === iframeRef.current?.contentWindow &&
        event.data?.type === "triad:cms-ready"
      ) {
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: "triad:cms-layout",
            blocks: blocks.map((block) => ({ id: block.key, visible: block.is_visible })),
          },
          window.location.origin,
        );
        return;
      }
      if (
        event.origin === window.location.origin &&
        event.source === iframeRef.current?.contentWindow &&
        (event.data?.type === "triad:cms-select" || event.data?.type === "triad:cms-inline-edit")
      ) {
        setSelected(event.data as SelectedElement);
        if (event.data?.type === "triad:cms-inline-edit") {
          const { blockKey, fieldKey, text } = event.data as SelectedElement;
          if (blockKey && fieldKey && typeof text === "string") {
            setDraftEdits((current) => ({
              ...current,
              [blockKey]: { ...current[blockKey], [fieldKey]: text },
            }));
            setDraftDirty(true);
          }
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [blocks]);

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: "triad:cms-layout",
        blocks: blocks.map((block) => ({ id: block.key, visible: block.is_visible })),
      },
      window.location.origin,
    );
  }, [blocks]);

  const draftDocument = () => ({
    ...getDefaultPageDocument(pageId),
    pageId,
    blocks: blocks.map((block) => ({
      id: block.key,
      kind: (block.kind ?? block.key) as PageBlock["kind"],
      label: block.name,
      visible: block.is_visible,
      mobileVisible: true,
      content: draftEdits[block.key] ?? {},
      items: block.key === "categories" ? categoryItems : block.key === "hero" ? heroItems : [],
      children: block.children ?? [],
      design: draftDesigns[block.key] ?? {},
    })),
    seo: pageSeo,
  });
  const saveDraftMutation = useMutation({
    mutationFn: () => savePageDraftFn({ data: { document: draftDocument() } }),
    onSuccess: () => {
      setDraftDirty(false);
      setLastSavedAt(new Date());
      void queryClient.invalidateQueries({ queryKey: ["admin-page-document", pageId] });
      toast.success("Draft saved");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save draft"),
  });
  const publishDocumentMutation = useMutation({
    mutationFn: () =>
      publishPageDocumentFn({
        data: {
          document: draftDocument(),
          expectedRevision: pageRecord?.draft_revision ?? undefined,
        },
      }),
    onSuccess: () => {
      setDraftDirty(false);
      void queryClient.invalidateQueries({ queryKey: ["admin-page-document", pageId] });
      toast.success(`${getDefaultPageDocument(pageId).title} published live`);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not publish page"),
  });
  const restoreRevisionMutation = useMutation({
    mutationFn: (revision: number) => restorePageRevisionFn({ data: { pageId, revision } }),
    onSuccess: () => {
      setDraftDirty(false);
      void queryClient.invalidateQueries({ queryKey: ["admin-page-document", pageId] });
      void queryClient.invalidateQueries({ queryKey: ["admin-page-revisions", pageId] });
      toast.success("Revision restored to draft");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not restore revision"),
  });
  const duplicateMutation = useMutation({
    mutationFn: (targetPageId: PageId) =>
      duplicatePageDocumentFn({ data: { sourcePageId: pageId, targetPageId } }),
    onSuccess: () => toast.success("Page duplicated"),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not duplicate page"),
  });
  const saveSectionMutation = useMutation({
    mutationFn: (name: string) => saveSavedSectionFn({ data: { name, document: draftDocument() } }),
    onSuccess: () => toast.success("Reusable section saved"),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save section"),
  });
  const saveHeroSlideMutation = useMutation({
    mutationFn: (slide: HeroSlide) =>
      saveSlideFn({
        data: {
          ...slide,
          sort_order: Number(slide.sort_order) || 0,
          overlay_opacity: Number(slide.overlay_opacity) || 0,
        } as never,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-slides"] });
      toast.success("Hero slide published");
    },
    onError: () => toast.error("Could not save hero slide"),
  });
  const deleteHeroSlideMutation = useMutation({
    mutationFn: (id: string) => deleteSlideFn({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-slides"] });
      toast.success("Hero slide deleted");
    },
    onError: () => toast.error("Could not delete hero slide"),
  });
  useEffect(() => {
    if (!autoSave || !draftDirty || saveDraftMutation.isPending) return;
    const timer = window.setTimeout(() => saveDraftMutation.mutate(), 1200);
    return () => window.clearTimeout(timer);
  }, [
    autoSave,
    blocks,
    categoryItems,
    draftDesigns,
    draftDirty,
    draftEdits,
    heroItems,
    pageSeo,
    saveDraftMutation,
  ]);
  const publishOrder = async () => {
    saveDraftMutation.mutate();
  };
  const metric = metrics.data ?? {
    totalClicks: 0,
    totalLeads: 0,
    conversionRate: 0,
    topCategory: { name: "No data" },
    whatsappClicks: 0,
    telClicks: 0,
    pendingLeads: 0,
    activeProducts: 0,
    velocity: [],
  };
  const activities: Activity[] = [
    ...((formLeads.data ?? []) as FormLead[]).map((lead) => ({
      id: lead.id,
      name: lead.name || "Website inquiry",
      detail: [lead.company, lead.service].filter(Boolean).join(" · ") || lead.email,
      status: lead.status,
      created_at: lead.created_at,
      kind: "form" as const,
    })),
    ...((whatsappLeads.data ?? []) as WhatsappLead[]).map((lead) => ({
      id: lead.id,
      name: lead.name || "WhatsApp inquiry",
      detail: lead.product_title || lead.phone,
      status: lead.status,
      created_at: lead.created_at,
      kind: "whatsapp" as const,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);
  const maxVelocity = Math.max(...metric.velocity.map((day) => day.clicks + day.leads), 1);
  const postUpdate = (payload: Record<string, unknown>) => {
    remember();
    setDraftDirty(true);
    const payloadText = typeof payload["text"] === "string" ? payload["text"] : undefined;
    const payloadImage = typeof payload["image"] === "string" ? payload["image"] : undefined;
    const payloadHref = typeof payload["href"] === "string" ? payload["href"] : undefined;
    const settingsMap = (globalSettings.data ?? {}) as Record<string, unknown>;

    if (selected?.blockKey === "global-footer" && selected.fieldKey && payloadText) {
      const footer = {
        ...((settingsMap["footer"] ?? {}) as Record<string, unknown>),
        [selected.fieldKey.replace("footer.", "")]: payloadText,
      };
      void saveSettingFn({ data: { key: "footer", value: footer } }).then(() => {
        void queryClient.invalidateQueries({ queryKey: ["admin-settings-for-builder"] });
        void queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      });
    }
    if (selected?.blockKey === "global-header" && selected.fieldKey && payloadText) {
      const match = selected.fieldKey.match(/^nav\.(\d+)\.label$/);
      if (match) {
        const navigation = Array.isArray(settingsMap["navigation"])
          ? [
              ...(settingsMap["navigation"] as {
                label: string;
                href: string;
                target: "_self" | "_blank";
              }[]),
            ]
          : [];
        const index = Number(match[1]);
        if (navigation[index]) {
          navigation[index] = { ...navigation[index], label: payloadText };
          void saveSettingFn({ data: { key: "navigation", value: navigation } }).then(() => {
            void queryClient.invalidateQueries({ queryKey: ["admin-settings-for-builder"] });
            void queryClient.invalidateQueries({ queryKey: ["site-settings"] });
          });
        }
      }
    }
    if (selected?.blockKey && payload["css"] && typeof payload["css"] === "object") {
      const css = payload["css"] as Record<string, string>;
      if (selected.fieldKey) {
        setDraftEdits((current) => ({
          ...current,
          [selected.blockKey as string]: {
            ...current[selected.blockKey as string],
            ...Object.fromEntries(
              Object.entries(css).map(([property, value]) => [
                `${selected.fieldKey}.${property}`,
                value,
              ]),
            ),
          },
        }));
      } else {
        setDraftDesigns((current) => ({
          ...current,
          [selected.blockKey as string]: {
            ...current[selected.blockKey as string],
            ...css,
          },
        }));
      }
    }
    if (selected?.blockKey && payload["responsive"] && typeof payload["responsive"] === "object") {
      const responsive = payload["responsive"] as Record<string, Record<string, string>>;
      setDraftDesigns((current) => ({
        ...current,
        [selected.blockKey as string]: {
          ...current[selected.blockKey as string],
          ...Object.fromEntries(
            Object.entries(responsive).flatMap(([breakpoint, styles]) =>
              Object.entries(styles).map(([property, value]) => [
                `${breakpoint}.${property}`,
                value,
              ]),
            ),
          ),
        },
      }));
    }
    if (selected?.blockKey && (selected.fieldKey || payloadHref !== undefined)) {
      const value = payloadText ?? payloadImage ?? payloadHref;
      if (value !== undefined) {
        const fieldKey = selected.fieldKey ?? `${selected.tag}.href`;
        setDraftEdits((current) => ({
          ...current,
          [selected.blockKey as string]: {
            ...current[selected.blockKey as string],
            [fieldKey]: value,
          },
        }));
      }
    }
    if (payloadText !== undefined || payloadImage !== undefined || payloadHref !== undefined) {
      setSelected((current) =>
        current
          ? {
              ...current,
              ...(payloadText !== undefined ? { text: payloadText } : {}),
              ...(payloadImage !== undefined ? { image: payloadImage } : {}),
              ...(payloadHref !== undefined ? { href: payloadHref } : {}),
            }
          : current,
      );
    }
    iframeRef.current?.contentWindow?.postMessage(
      { type: "triad:cms-update", selector: selected?.selector, ...payload },
      window.location.origin,
    );
  };
  const moveBlock = (index: number, direction: -1 | 1) => (
    remember(),
    setBlocks((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      const sourceBlock = next[index];
      const targetBlock = next[target];
      if (!sourceBlock || !targetBlock) return current;
      next[index] = targetBlock;
      next[target] = sourceBlock;
      setDraftDirty(true);
      return next.map((block, order) => ({ ...block, sort_order: order }));
    })
  );
  const moveDraggedBlock = (targetId: string) => {
    if (!draggedBlock || draggedBlock === targetId) return;
    remember();
    setBlocks((current) => {
      const sourceIndex = current.findIndex((block) => block.id === draggedBlock);
      const targetIndex = current.findIndex((block) => block.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [source] = next.splice(sourceIndex, 1);
      if (!source) return current;
      next.splice(targetIndex, 0, source);
      setDraftDirty(true);
      return next.map((block, order) => ({ ...block, sort_order: order }));
    });
    setDraggedBlock(null);
  };
  const addBlock = (kind: (typeof blockCatalog)[number]["kind"]) => {
    const template = blockCatalog.find((item) => item.kind === kind);
    if (!template) return;
    remember();
    const id = `${kind}-${Date.now()}`;
    setBlocks((current) => [
      ...current,
      {
        id,
        name: template.label,
        key: id,
        kind,
        is_visible: true,
        sort_order: current.length,
        local: true,
      },
    ]);
    setDraftEdits((current) => ({
      ...current,
      [id]: { ...template.defaultContent },
    }));
    setDraftDirty(true);
    setBlockPickerOpen(false);
  };
  const addChildBlock = (parentId: string, kind: PageBlock["kind"]) => {
    remember();
    const child: PageBlock = {
      id: `${kind}-${Date.now()}`,
      kind,
      label: blockCatalog.find((item) => item.kind === kind)?.label ?? "Content block",
      visible: true,
      mobileVisible: true,
      content:
        kind === "rich_text"
          ? { eyebrow: "New content", heading: "Add a headline.", body: "" }
          : {},
      items: [],
      design: {},
      children: [],
    };
    setBlocks((current) =>
      current.map((block) =>
        block.id === parentId ? { ...block, children: [...(block.children ?? []), child] } : block,
      ),
    );
    setDraftDirty(true);
  };
  const viewportWidth = { desktop: "100%", tablet: "768px", mobile: "390px" }[viewport];
  const viewportLabel = { desktop: "Desktop", tablet: "Tablet", mobile: "Mobile" }[viewport];
  const updateCategoryItem = (index: number, patch: Partial<PageBlockItem>) => {
    setCategoryItems((items) =>
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );
    setDraftDirty(true);
  };
  const uploadCategoryImage = async (index: number, file: File) => {
    setUploadingCategoryIndex(index);
    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      const base64 = await fileToBase64(file);
      const result = await uploadSiteAssetFn({
        data: { kind: "media", filename: file.name, contentType: file.type, base64 },
      });
      updateCategoryItem(index, { image: result.publicUrl });
      void queryClient.invalidateQueries({ queryKey: ["admin-site-assets"] });
      toast.success("Category image uploaded", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload image", {
        id: toastId,
      });
    } finally {
      setUploadingCategoryIndex(null);
    }
  };
  const addHeroSlide = () => {
    const key = `new-${crypto.randomUUID()}`;
    setHeroSlideDrafts((current) => ({
      ...current,
      [key]: {
        eyebrow: "New slide",
        headline: "Add a headline",
        subtext: "Add supporting copy",
        cta_label: "Request Custom Quote",
        cta_href: "#quote",
        image_url: null,
        overlay_opacity: 60,
        active: true,
        sort_order: Object.keys(current).length,
      },
    }));
  };
  const uploadHeroSlideAsset = async (key: string, file: File) => {
    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      const base64 = await fileToBase64(file);
      const { publicUrl } = await uploadHeroSlideImageFn({
        data: { filename: file.name, contentType: file.type, base64 },
      });
      setHeroSlideDrafts((current) => ({
        ...current,
        [key]: { ...current[key]!, image_url: publicUrl },
      }));
      toast.success("Hero image uploaded", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload image", {
        id: toastId,
      });
    }
  };

  return (
    <AdminPage
      eyebrow="Visual content studio"
      title="Edit the storefront in context."
      description="Select live content, tune its properties, and arrange structured blocks before publishing to Nairobi customers."
      action={
        <div className="flex items-center gap-2">
          <StatusPill status="Preview live" />
          <button
            type="button"
            onClick={undo}
            disabled={!history.past.length}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[#D0D5DD] bg-white text-[#344054] hover:border-[#208454] hover:text-[#208454] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Undo last editor change"
            title="Undo (Cmd/Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!history.future.length}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[#D0D5DD] bg-white text-[#344054] hover:border-[#208454] hover:text-[#208454] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Redo editor change"
            title="Redo (Cmd/Ctrl+Shift+Z)"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPreviewKey((key) => key + 1)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[#D0D5DD] bg-white text-[#344054] hover:border-[#208454] hover:text-[#208454]"
            aria-label="Refresh preview"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-3 text-xs font-semibold text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open site
          </a>
        </div>
      }
    >
      {showOverview ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Live clicks"
              value={metric.totalClicks.toLocaleString()}
              detail="Realtime storefront actions"
              icon={MousePointer2}
              tone="dark"
            />
            <MetricCard
              label="Open leads"
              value={metric.totalLeads.toLocaleString()}
              detail="Across WhatsApp and forms"
              icon={LayoutTemplate}
              tone="green"
            />
            <MetricCard
              label="Leading category"
              value={metric.topCategory.name}
              detail="Most active this month"
              icon={Palette}
              tone="amber"
            />
            <MetricCard
              label="Conversion"
              value={`${metric.conversionRate}%`}
              detail="Confirmed order rate"
              icon={Check}
              tone="red"
            />
          </div>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <Panel>
              <PanelHeading
                icon={BarChart3}
                title="Storefront pulse"
                detail="Clicks and inquiries across the last seven days"
                action={<StatusPill status="Last 7 days" />}
              />
              <div className="p-5 md:p-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-semibold tracking-[-0.05em] text-white">
                      {metric.totalClicks.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-[#94A3B8]">
                      tracked actions in the last 30 days
                    </p>
                  </div>
                  <div className="text-right text-xs text-[#94A3B8]">
                    <p>
                      <span className="font-semibold text-[#FF9500]">{metric.whatsappClicks}</span>{" "}
                      WhatsApp
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-emerald-300">{metric.telClicks}</span>{" "}
                      phone
                    </p>
                  </div>
                </div>
                <div className="mt-8 grid h-40 grid-cols-7 items-end gap-2">
                  {metric.velocity.map((day) => {
                    const total = day.clicks + day.leads;
                    return (
                      <div
                        key={day.day}
                        className="flex h-full flex-col items-center justify-end gap-2"
                      >
                        <div className="flex h-full w-full items-end justify-center gap-1 rounded-t-lg bg-white/[0.03] px-1 pt-2">
                          <span
                            className="w-1/2 rounded-t-sm bg-[#FF7A00] transition-all"
                            style={{
                              height: `${Math.max((day.clicks / maxVelocity) * 100, day.clicks ? 8 : 2)}%`,
                            }}
                            title={`${day.clicks} clicks`}
                          />
                          <span
                            className="w-1/2 rounded-t-sm bg-emerald-400 transition-all"
                            style={{
                              height: `${Math.max((day.leads / maxVelocity) * 100, day.leads ? 8 : 2)}%`,
                            }}
                            title={`${day.leads} leads`}
                          />
                        </div>
                        <span className="text-[10px] text-[#64748B]">{day.day}</span>
                        <span className="sr-only">{total} total actions</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 flex flex-wrap gap-4 text-[10px] uppercase tracking-[0.14em] text-[#64748B]">
                  <span className="flex items-center gap-2">
                    <i className="h-2 w-2 rounded-full bg-[#FF7A00]" /> Clicks
                  </span>
                  <span className="flex items-center gap-2">
                    <i className="h-2 w-2 rounded-full bg-emerald-400" /> Leads
                  </span>
                </div>
              </div>
            </Panel>
            <Panel>
              <PanelHeading
                icon={ArrowUpRight}
                title="Quick actions"
                detail="Jump into the work that needs attention"
              />
              <div className="grid gap-2 p-4">
                <QuickAction
                  href="/admin/whatsapp"
                  icon={MessageCircle}
                  label="Review WhatsApp inquiries"
                  detail={`${metric.pendingLeads} pending responses`}
                />
                <QuickAction
                  href="/admin/catalog"
                  icon={Package}
                  label="Manage catalog"
                  detail={`${metric.activeProducts} active products`}
                />
                <QuickAction
                  href="/admin/projects"
                  icon={Briefcase}
                  label="Update portfolio"
                  detail="Keep recent work visible"
                />
                <QuickAction
                  href="/admin/services"
                  icon={Wrench}
                  label="Refine services"
                  detail="Shape your offer"
                />
              </div>
            </Panel>
          </div>
          <Panel>
            <PanelHeading
              icon={MessageCircle}
              title="Recent activity"
              detail="The latest customer signals from your storefront"
              action={
                <a
                  href="/admin/whatsapp"
                  className="text-xs font-semibold text-[#FF9500] hover:text-white"
                >
                  Open lead inbox <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" />
                </a>
              }
            />
            {activities.length === 0 ? (
              <div className="p-6 text-sm text-[#94A3B8]">No customer activity has landed yet.</div>
            ) : (
              <div className="divide-y divide-white/[0.06] md:grid md:grid-cols-2 md:divide-y-0">
                {activities.map((activity) => (
                  <div
                    key={`${activity.kind}-${activity.id}`}
                    className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4 last:border-0 md:border-b md:border-r md:px-6"
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${activity.kind === "whatsapp" ? "bg-emerald-400/10 text-emerald-300" : "bg-[#FF7A00]/10 text-[#FF9500]"}`}
                    >
                      {activity.kind === "whatsapp" ? (
                        <MessageCircle className="h-4 w-4" />
                      ) : (
                        <LayoutTemplate className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{activity.name}</p>
                      <p className="mt-1 truncate text-xs text-[#94A3B8]">{activity.detail}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusPill status={activity.status} />
                      <p className="mt-1 text-[10px] text-[#64748B]">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-[#DCE1E7] bg-[#E9EDF0] shadow-[0_16px_50px_rgba(17,24,39,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE1E7] bg-white px-4 py-3 md:px-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">
              Visual page editor
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-[#111827]">
                Editing: {getDefaultPageDocument(pageId).title}
              </h2>
              <select
                value={pageId}
                onChange={(event) => {
                  setPageId(event.target.value as PageId);
                  setSelected(null);
                  setDraftDirty(false);
                }}
                className="rounded-lg border border-[#D0D5DD] bg-white px-2 py-1.5 text-xs font-semibold text-[#344054]"
                aria-label="Select page to edit"
              >
                {(
                  [
                    ["home", "Home"],
                    ["shop", "Shop"],
                    ["solutions", "Solutions"],
                    ["about", "About"],
                    ["contact", "Contact"],
                    ["category", "Category detail"],
                    ["product", "Product detail"],
                    ["work", "Work detail"],
                    ["privacy", "Privacy policy"],
                    ["terms", "Terms"],
                    ["cookies", "Cookies"],
                  ] as [PageId, string][]
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const target = window.prompt(
                    "Duplicate this page to (home, shop, solutions, about, contact, category, product, work):",
                  );
                  if (target) {
                    const targetPage = target as PageId;
                    if (
                      [
                        "home",
                        "shop",
                        "solutions",
                        "about",
                        "contact",
                        "category",
                        "product",
                        "work",
                        "privacy",
                        "terms",
                        "cookies",
                      ].includes(targetPage)
                    ) {
                      duplicateMutation.mutate(targetPage);
                    }
                  }
                }}
                disabled={duplicateMutation.isPending}
                className="rounded-lg border border-[#D0D5DD] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#344054] hover:border-[#FF7A00] hover:text-[#B54708]"
              >
                Duplicate
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-[#E4E7EC] bg-[#F8F9FA] p-1">
              {(
                [
                  ["desktop", "Desktop", LayoutTemplate],
                  ["tablet", "Tablet", Tablet],
                  ["mobile", "Mobile", Smartphone],
                ] as const
              ).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setViewport(value)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-semibold transition-colors ${viewport === value ? "bg-white text-[#111827] shadow-sm" : "text-[#98A2B3] hover:text-[#344054]"}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            <span
              className={`rounded-lg px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${draftDirty ? "bg-[#FFF4E5] text-[#B54708]" : "bg-[#ECFDF3] text-[#027A48]"}`}
            >
              {draftDirty ? "Unsaved draft" : "Saved draft"}
            </span>
            <span className="rounded-lg bg-[#F8F9FA] px-2.5 py-2 text-[10px] font-semibold text-[#667085]">
              {saveDraftMutation.isPending
                ? "Saving…"
                : lastSavedAt
                  ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "Not saved yet"}
            </span>
            <label className="flex items-center gap-1.5 rounded-lg border border-[#D0D5DD] bg-white px-2.5 py-2 text-[10px] font-semibold text-[#344054]">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(event) => setAutoSave(event.target.checked)}
                className="accent-[#FF7A00]"
              />
              Autosave
            </label>
            <select
              defaultValue=""
              onChange={(event) => {
                const revision = Number(event.target.value);
                if (revision) restoreRevisionMutation.mutate(revision);
                event.currentTarget.value = "";
              }}
              disabled={restoreRevisionMutation.isPending || !revisions.data?.length}
              className="rounded-lg border border-[#D0D5DD] bg-white px-2.5 py-2.5 text-[10px] font-semibold text-[#344054] disabled:opacity-45"
              aria-label="Restore a previous draft revision"
            >
              <option value="">Revision history</option>
              {(
                (revisions.data ?? []) as Array<{
                  id: string;
                  revision: number;
                  created_at: string;
                }>
              ).map((revision) => (
                <option key={revision.id} value={revision.revision}>
                  {`Restore v${revision.revision} · ${new Date(revision.created_at).toLocaleString()}`}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => publishDocumentMutation.mutate()}
              disabled={publishDocumentMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F04438] via-[#FF7A00] to-[#F79009] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(255,122,0,.24)] transition-transform hover:-translate-y-0.5"
            >
              <Save className="h-3.5 w-3.5" /> Publish Live
            </button>
            <button
              type="button"
              onClick={() => {
                const name = window.prompt("Name this reusable section");
                if (name?.trim()) saveSectionMutation.mutate(name.trim());
              }}
              disabled={saveSectionMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-[#D0D5DD] bg-white px-3 py-2.5 text-xs font-semibold text-[#344054] hover:border-[#208454] hover:text-[#208454]"
            >
              Save Section
            </button>
            <button
              type="button"
              onClick={() => saveDraftMutation.mutate()}
              disabled={saveDraftMutation.isPending || !draftDirty}
              className="inline-flex items-center gap-2 rounded-xl border border-[#D0D5DD] bg-white px-3 py-2.5 text-xs font-semibold text-[#344054] transition-colors hover:border-[#98A2B3] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Save className="h-3.5 w-3.5" />{" "}
              {saveDraftMutation.isPending ? "Saving…" : "Save Draft"}
            </button>
          </div>
        </div>
        <div className="grid min-h-[720px] xl:grid-cols-[248px_minmax(0,1fr)_320px]">
          {structureOpen ? (
            <aside className="hidden border-r border-[#DCE1E7] bg-white xl:block">
              <div className="flex items-center justify-between border-b border-[#EEF0F2] px-4 py-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#98A2B3]">
                    Structure
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-[#111827]">Page layers</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setStructureOpen(false)}
                  className="rounded-lg p-1.5 text-[#98A2B3] hover:bg-[#F2F4F7] hover:text-[#344054]"
                  aria-label="Collapse page structure"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1 p-3">
                {blocks.map((block, index) => (
                  <button
                    key={block.id}
                    type="button"
                    draggable
                    onDragStart={() => setDraggedBlock(block.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => moveDraggedBlock(block.id)}
                    onClick={() => {
                      setSelected({
                        selector: `[data-cms-block="${block.key}"]`,
                        tag: "section",
                        text: block.name,
                        image: null,
                      });
                    }}
                    className={`group flex w-full items-center gap-2 rounded-xl border px-2.5 py-3 text-left transition-colors ${selected?.text === block.name ? "border-[#FF7A00]/30 bg-[#FFF7ED]" : "border-transparent hover:border-[#E4E7EC] hover:bg-[#F8F9FA]"}`}
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#F2F4F7] font-mono text-[9px] text-[#667085]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-[#344054]">
                        {block.name}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[9px] uppercase tracking-[0.08em] text-[#98A2B3]">
                        {block.key}
                      </span>
                    </span>
                    {block.is_visible ? (
                      <Eye className="h-3.5 w-3.5 text-[#98A2B3]" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-[#D0D5DD]" />
                    )}
                  </button>
                ))}
              </div>
              <div className="mx-3 mt-3 rounded-xl bg-[#F8F9FA] p-3 text-[11px] leading-5 text-[#667085]">
                Drag sections to change their order. Select a layer to open its settings.
              </div>
            </aside>
          ) : (
            <button
              type="button"
              onClick={() => setStructureOpen(true)}
              className="absolute z-10 mt-4 hidden rounded-r-xl border border-l-0 border-[#DCE1E7] bg-white p-2 text-[#667085] shadow-sm xl:block"
              aria-label="Expand page structure"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          <div className="cms-preview-stage min-w-0 p-3 md:p-5">
            <div className="mb-3 flex items-center justify-between text-xs text-[#667085]">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#3FD07E]" /> Live preview
              </span>
              <span>
                {viewportLabel} · {viewport === "desktop" ? "1440" : viewportWidth}
              </span>
            </div>
            <div
              className="cms-preview-frame mx-auto transition-[width] duration-300"
              style={{ width: viewportWidth, maxWidth: "100%" }}
            >
              <iframe
                key={previewKey}
                ref={iframeRef}
                title="Triad storefront visual preview"
                src={`${pagePath(pageId)}?cmsPreview=1`}
                className="h-full w-full border-0 bg-white"
              />
            </div>
          </div>
          <aside className="border-t border-[#DCE1E7] bg-[#111827] text-white xl:border-l xl:border-t-0">
            <div className="flex border-b border-white/10">
              <button
                type="button"
                onClick={() => setInspectorTab("content")}
                className={`flex-1 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] ${inspectorTab === "content" ? "border-b-2 border-[#F97316] text-white" : "text-white/45"}`}
              >
                <Type className="mr-2 inline h-3.5 w-3.5" /> Content
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab("design")}
                className={`flex-1 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] ${inspectorTab === "design" ? "border-b-2 border-[#10B981] text-white" : "text-white/45"}`}
              >
                <Palette className="mr-2 inline h-3.5 w-3.5" /> Design
              </button>
            </div>
            <Inspector
              tab={inspectorTab}
              selected={selected}
              postUpdate={postUpdate}
              assets={(mediaAssets.data ?? []) as { id: string; path: string; publicUrl: string }[]}
              deleteAsset={async (path) => {
                await deleteSiteAssetFn({ data: { path } });
                void queryClient.invalidateQueries({ queryKey: ["admin-site-assets"] });
              }}
              uploadAsset={async (file) => {
                const base64 = await fileToBase64(file);
                const result = await uploadSiteAssetFn({
                  data: { kind: "media", filename: file.name, contentType: file.type, base64 },
                });
                void queryClient.invalidateQueries({ queryKey: ["admin-site-assets"] });
                return result.publicUrl;
              }}
              onRefreshAssets={() =>
                void queryClient.invalidateQueries({ queryKey: ["admin-site-assets"] })
              }
            />
          </aside>
        </div>
        <div className="border-t border-[#DCE1E7] bg-white">
          <div className="flex items-center justify-between border-b border-[#EEF0F2] px-4 py-3 md:px-5">
            <div>
              <h2 className="text-sm font-semibold text-[#111827]">Page structure</h2>
              <p className="mt-1 text-xs text-[#98A2B3]">
                Structured slices render in this order on the storefront.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={publishOrder}
                className="inline-flex items-center gap-2 rounded-lg bg-[#111827] px-3 py-2 text-xs font-semibold text-white hover:bg-[#273449]"
              >
                <Save className="h-3.5 w-3.5" /> Save structure draft
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBlockPickerOpen((open) => !open)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#D0D5DD] px-3 py-2 text-xs font-semibold text-[#344054] hover:border-[#208454] hover:text-[#208454]"
                >
                  <Plus className="h-3.5 w-3.5" /> Add block
                </button>
                {blockPickerOpen ? (
                  <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-2xl border border-[#D0D5DD] bg-white p-2 shadow-xl">
                    {blockCatalog.map((template) => (
                      <button
                        key={template.kind}
                        type="button"
                        onClick={() => addBlock(template.kind)}
                        className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[#F8F9FA]"
                      >
                        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#FFF4E5] text-[#B54708]">
                          <Plus className="h-3.5 w-3.5" />
                        </span>
                        <span>
                          <span className="block text-xs font-semibold text-[#344054]">
                            {template.label}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-[#98A2B3]">
                            {template.detail}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="grid gap-2 p-4 md:grid-cols-2 xl:grid-cols-4">
            {blocks.map((block, index) => (
              <BlockCard
                key={block.id}
                block={block}
                index={index}
                total={blocks.length}
                onMove={moveBlock}
                onSave={(next) => {
                  if (!next.local) setDraftDirty(true);
                }}
                onDuplicate={(source) =>
                  setBlocks((current) => [
                    ...current.slice(0, index + 1),
                    {
                      ...source,
                      id: `copy-${Date.now()}`,
                      name: `${source.name} copy`,
                      local: true,
                    },
                    ...current.slice(index + 1),
                  ])
                }
                onDelete={(id) => setBlocks((current) => current.filter((item) => item.id !== id))}
                onToggle={(id, is_visible) => {
                  setBlocks((current) =>
                    current.map((item) => (item.id === id ? { ...item, is_visible } : item)),
                  );
                  setDraftDirty(true);
                }}
                onAddChild={addChildBlock}
              />
            ))}
          </div>
          <div className="border-t border-[#EEF0F2] px-4 py-4 md:px-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#111827]">Category collection</p>
                <p className="mt-1 text-[11px] text-[#98A2B3]">
                  Manage the repeatable cards shown in the category grid.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCategoryItems((items) => [
                    ...items,
                    {
                      id: `category-${Date.now()}`,
                      label: "New category",
                      description: "Add a short description",
                      href: "/solutions",
                      buttonLabel: "Browse",
                    },
                  ]);
                  setDraftDirty(true);
                }}
                className="rounded-lg border border-[#D0D5DD] px-3 py-2 text-[11px] font-semibold text-[#344054] hover:border-[#FF7A00] hover:text-[#B54708]"
              >
                Add category
              </button>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {categoryItems.map((item, index) => (
                <div
                  key={item.id}
                  className="grid gap-2 rounded-xl border border-[#E4E7EC] bg-[#F8F9FA] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
                      Category {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryItems((items) =>
                          items.filter((_, itemIndex) => itemIndex !== index),
                        );
                        setDraftDirty(true);
                      }}
                      className="rounded-lg px-2 text-xs text-[#98A2B3] hover:bg-[#FDECEC] hover:text-[#C01020]"
                      aria-label={`Remove ${item.label}`}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      value={item.label}
                      onChange={(event) => updateCategoryItem(index, { label: event.target.value })}
                      className="rounded-lg border border-[#E4E7EC] bg-white px-2.5 py-2 text-xs text-[#344054] outline-none focus:border-[#FF7A00]"
                      placeholder="Category name"
                      aria-label="Category name"
                    />
                    <input
                      value={item.buttonLabel ?? "Browse"}
                      onChange={(event) =>
                        updateCategoryItem(index, { buttonLabel: event.target.value })
                      }
                      className="rounded-lg border border-[#E4E7EC] bg-white px-2.5 py-2 text-xs text-[#344054] outline-none focus:border-[#FF7A00]"
                      placeholder="Button label"
                      aria-label="Category button label"
                    />
                  </div>
                  <textarea
                    value={item.description}
                    onChange={(event) =>
                      updateCategoryItem(index, { description: event.target.value })
                    }
                    className="min-h-16 rounded-lg border border-[#E4E7EC] bg-white px-2.5 py-2 text-xs text-[#344054] outline-none focus:border-[#FF7A00]"
                    placeholder="Category description"
                    aria-label="Category description"
                  />
                  <input
                    value={item.href}
                    onChange={(event) => updateCategoryItem(index, { href: event.target.value })}
                    className="rounded-lg border border-[#E4E7EC] bg-white px-2.5 py-2 text-xs text-[#344054] outline-none focus:border-[#FF7A00]"
                    placeholder="Link target, e.g. /category/apparel"
                    aria-label="Category link target"
                  />
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <input
                      value={item.image ?? ""}
                      onChange={(event) => {
                        const nextValue = event.target.value.trim();
                        updateCategoryItem(index, nextValue ? { image: nextValue } : {});
                      }}
                      className="rounded-lg border border-[#E4E7EC] bg-white px-2.5 py-2 text-xs text-[#344054] outline-none focus:border-[#FF7A00]"
                      placeholder="Image URL"
                      aria-label="Category image URL"
                    />
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-[11px] font-semibold text-[#344054] hover:border-[#FF7A00] hover:text-[#B54708]">
                      {uploadingCategoryIndex === index ? "Uploading..." : "Upload image"}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={uploadingCategoryIndex !== null}
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          if (file) void uploadCategoryImage(index, file);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <select
                    value={item.image ?? ""}
                    onChange={(event) => {
                      const nextValue = event.target.value.trim();
                      updateCategoryItem(index, nextValue ? { image: nextValue } : {});
                    }}
                    className="rounded-lg border border-[#E4E7EC] bg-white px-2.5 py-2 text-xs text-[#344054] outline-none focus:border-[#FF7A00]"
                    aria-label="Choose category image from media library"
                  >
                    <option value="">Use default category image</option>
                    {(mediaAssets.data ?? []).map((asset) => (
                      <option key={asset.id} value={asset.publicUrl}>
                        {asset.path}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-[#EEF0F2] px-4 py-4 md:px-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#111827]">Hero slides</p>
                <p className="mt-1 text-[11px] text-[#98A2B3]">
                  Manage the slide content shown in this page's hero carousel.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHeroItems((items) => [
                    ...items,
                    {
                      id: `hero-${Date.now()}`,
                      label: "New slide",
                      description: "Add supporting copy",
                      href: "/shop",
                      buttonLabel: "Browse",
                    },
                  ]);
                  setDraftDirty(true);
                }}
                className="rounded-lg border border-[#D0D5DD] px-3 py-2 text-[11px] font-semibold text-[#344054] hover:border-[#FF7A00] hover:text-[#B54708]"
              >
                Add slide
              </button>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {heroItems.map((item, index) => (
                <div
                  key={item.id}
                  className="grid gap-2 rounded-xl border border-[#E4E7EC] bg-[#F8F9FA] p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-[#98A2B3]">
                      Slide {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setHeroItems((items) =>
                          items.filter((_, itemIndex) => itemIndex !== index),
                        );
                        setDraftDirty(true);
                      }}
                      className="ml-auto rounded-lg px-2 py-1 text-[11px] text-[#98A2B3] hover:bg-[#FDECEC] hover:text-[#C01020]"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    value={item.label}
                    onChange={(event) => {
                      setHeroItems((items) =>
                        items.map((current, itemIndex) =>
                          itemIndex === index ? { ...current, label: event.target.value } : current,
                        ),
                      );
                      setDraftDirty(true);
                    }}
                    className="rounded-lg border border-[#E4E7EC] bg-white px-2.5 py-2 text-xs text-[#344054] outline-none focus:border-[#FF7A00]"
                    placeholder="Slide headline"
                    aria-label="Hero slide headline"
                  />
                  <textarea
                    value={item.description}
                    onChange={(event) => {
                      setHeroItems((items) =>
                        items.map((current, itemIndex) =>
                          itemIndex === index
                            ? { ...current, description: event.target.value }
                            : current,
                        ),
                      );
                      setDraftDirty(true);
                    }}
                    className="min-h-16 rounded-lg border border-[#E4E7EC] bg-white px-2.5 py-2 text-xs text-[#344054] outline-none focus:border-[#FF7A00]"
                    placeholder="Supporting copy"
                    aria-label="Hero slide description"
                  />
                  <input
                    value={item.image ?? ""}
                    onChange={(event) => {
                      const nextImage = event.target.value.trim();
                      setHeroItems((items) =>
                        items.map((current, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...current,
                                ...(nextImage ? { image: nextImage } : {}),
                              }
                            : current,
                        ),
                      );
                      setDraftDirty(true);
                    }}
                    className="rounded-lg border border-[#E4E7EC] bg-white px-2.5 py-2 text-xs text-[#344054] outline-none focus:border-[#FF7A00]"
                    placeholder="Image URL or select from media library"
                    aria-label="Hero slide image URL"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-[#EEF0F2] px-4 py-4 md:px-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#111827]">Hero carousel studio</p>
                <p className="mt-1 text-[11px] text-[#98A2B3]">
                  Manage the live hero slides shared by the storefront.
                </p>
              </div>
              <button
                type="button"
                onClick={addHeroSlide}
                className="rounded-lg border border-[#D0D5DD] px-3 py-2 text-[11px] font-semibold text-[#344054] hover:border-[#FF7A00] hover:text-[#B54708]"
              >
                Add slide
              </button>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {Object.entries(heroSlideDrafts).map(([slideKey, slide]) => (
                <HeroSlideCard
                  key={slideKey}
                  slide={slide}
                  saving={saveHeroSlideMutation.isPending}
                  onChange={(next) =>
                    setHeroSlideDrafts((current) => ({ ...current, [slideKey]: next }))
                  }
                  onSave={() => saveHeroSlideMutation.mutate(slide)}
                  onDelete={() => {
                    if (!slide.id) {
                      setHeroSlideDrafts((current) => {
                        const next = { ...current };
                        delete next[slideKey];
                        return next;
                      });
                      return;
                    }
                    if (window.confirm("Delete this hero slide?")) {
                      deleteHeroSlideMutation.mutate(slide.id);
                    }
                  }}
                  onUploadImage={(file) => uploadHeroSlideAsset(slideKey, file)}
                />
              ))}
            </div>
          </div>
          <div className="border-t border-[#EEF0F2] px-4 py-4 md:px-5">
            <div>
              <p className="text-xs font-semibold text-[#111827]">Page SEO</p>
              <p className="mt-1 text-[11px] text-[#98A2B3]">Metadata published with this page.</p>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <input
                value={pageSeo.title}
                onChange={(event) => {
                  setPageSeo((current) => ({ ...current, title: event.target.value }));
                  setDraftDirty(true);
                }}
                className="rounded-lg border border-[#E4E7EC] bg-white px-2.5 py-2 text-xs text-[#344054] outline-none focus:border-[#FF7A00]"
                placeholder="Page title"
                aria-label="Page SEO title"
              />
              <input
                value={pageSeo.description}
                onChange={(event) => {
                  setPageSeo((current) => ({ ...current, description: event.target.value }));
                  setDraftDirty(true);
                }}
                className="rounded-lg border border-[#E4E7EC] bg-white px-2.5 py-2 text-xs text-[#344054] outline-none focus:border-[#FF7A00]"
                placeholder="Meta description"
                aria-label="Page SEO description"
              />
              <input
                value={pageSeo.canonical}
                onChange={(event) => {
                  setPageSeo((current) => ({ ...current, canonical: event.target.value }));
                  setDraftDirty(true);
                }}
                className="rounded-lg border border-[#E4E7EC] bg-white px-2.5 py-2 text-xs text-[#344054] outline-none focus:border-[#FF7A00]"
                placeholder="Canonical URL"
                aria-label="Page canonical URL"
              />
              <input
                value={pageSeo.ogTitle}
                onChange={(event) => {
                  setPageSeo((current) => ({ ...current, ogTitle: event.target.value }));
                  setDraftDirty(true);
                }}
                className="rounded-lg border border-[#E4E7EC] bg-white px-2.5 py-2 text-xs text-[#344054] outline-none focus:border-[#FF7A00]"
                placeholder="Open Graph title"
                aria-label="Open Graph title"
              />
              <input
                value={pageSeo.ogDescription}
                onChange={(event) => {
                  setPageSeo((current) => ({ ...current, ogDescription: event.target.value }));
                  setDraftDirty(true);
                }}
                className="rounded-lg border border-[#E4E7EC] bg-white px-2.5 py-2 text-xs text-[#344054] outline-none focus:border-[#FF7A00]"
                placeholder="Open Graph description"
                aria-label="Open Graph description"
              />
              <input
                value={pageSeo.ogImage}
                onChange={(event) => {
                  setPageSeo((current) => ({ ...current, ogImage: event.target.value }));
                  setDraftDirty(true);
                }}
                className="rounded-lg border border-[#E4E7EC] bg-white px-2.5 py-2 text-xs text-[#344054] outline-none focus:border-[#FF7A00]"
                placeholder="Open Graph image URL"
                aria-label="Open Graph image URL"
              />
              <select
                value={pageSeo.twitterCard}
                onChange={(event) => {
                  setPageSeo((current) => ({
                    ...current,
                    twitterCard: event.target.value as typeof current.twitterCard,
                  }));
                  setDraftDirty(true);
                }}
                className="rounded-lg border border-[#E4E7EC] bg-white px-2.5 py-2 text-xs text-[#344054] outline-none focus:border-[#FF7A00]"
                aria-label="Twitter card type"
              >
                <option value="summary_large_image">Twitter large image</option>
                <option value="summary">Twitter summary</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}

function HeroSlideCard({
  slide,
  saving,
  onChange,
  onSave,
  onDelete,
  onUploadImage,
}: {
  slide: HeroSlide;
  saving: boolean;
  onChange: (slide: HeroSlide) => void;
  onSave: () => void;
  onDelete: () => void;
  onUploadImage: (file: File) => Promise<void>;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-[#E4E7EC] bg-white">
      <div
        className="flex min-h-24 items-end justify-between bg-[#111827] p-3"
        style={
          slide.image_url
            ? {
                backgroundImage: `linear-gradient(90deg, rgba(17,24,39,.85), rgba(17,24,39,.25)), url(${slide.image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/60">
            {slide.eyebrow || "Hero slide"}
          </p>
          <p className="mt-1 max-w-xs text-base font-semibold text-white">
            {slide.headline || "Untitled slide"}
          </p>
        </div>
        <Toggle
          label="Toggle hero slide"
          checked={slide.active}
          onChange={(active) => onChange({ ...slide, active })}
        />
      </div>
      <div className="grid gap-2 p-3">
        <input
          value={slide.eyebrow}
          onChange={(event) => onChange({ ...slide, eyebrow: event.target.value })}
          className="rounded-lg border border-[#E4E7EC] px-2.5 py-2 text-xs outline-none focus:border-[#FF7A00]"
          placeholder="Eyebrow"
        />
        <input
          value={slide.headline}
          onChange={(event) => onChange({ ...slide, headline: event.target.value })}
          className="rounded-lg border border-[#E4E7EC] px-2.5 py-2 text-xs outline-none focus:border-[#FF7A00]"
          placeholder="Headline"
        />
        <textarea
          value={slide.subtext}
          onChange={(event) => onChange({ ...slide, subtext: event.target.value })}
          className="min-h-16 resize-y rounded-lg border border-[#E4E7EC] px-2.5 py-2 text-xs outline-none focus:border-[#FF7A00]"
          placeholder="Supporting copy"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={slide.cta_label}
            onChange={(event) => onChange({ ...slide, cta_label: event.target.value })}
            className="rounded-lg border border-[#E4E7EC] px-2.5 py-2 text-xs outline-none focus:border-[#FF7A00]"
            placeholder="CTA label"
          />
          <input
            value={slide.cta_href}
            onChange={(event) => onChange({ ...slide, cta_href: event.target.value })}
            className="rounded-lg border border-[#E4E7EC] px-2.5 py-2 text-xs outline-none focus:border-[#FF7A00]"
            placeholder="CTA href"
          />
        </div>
        <input
          value={slide.image_url ?? ""}
          onChange={(event) => onChange({ ...slide, image_url: event.target.value || null })}
          className="rounded-lg border border-[#E4E7EC] px-2.5 py-2 text-xs outline-none focus:border-[#FF7A00]"
          placeholder="Background image URL"
        />
        <label className="inline-flex w-fit cursor-pointer items-center rounded-lg border border-[#D0D5DD] px-3 py-2 text-[11px] font-semibold text-[#344054] hover:border-[#FF7A00] hover:text-[#B54708]">
          Upload image
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onUploadImage(file);
              event.target.value = "";
            }}
          />
        </label>
        <label className="text-[11px] text-[#667085]">
          Overlay opacity
          <input
            type="range"
            min="0"
            max="100"
            value={slide.overlay_opacity}
            onChange={(event) =>
              onChange({ ...slide, overlay_opacity: Number(event.target.value) })
            }
            className="mt-2 w-full accent-[#FF7A00]"
          />
        </label>
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] text-[#667085]">
            Order
            <input
              type="number"
              value={slide.sort_order}
              onChange={(event) => onChange({ ...slide, sort_order: Number(event.target.value) })}
              className="ml-2 w-14 rounded-lg border border-[#DCE1E7] px-2 py-1.5 text-center text-xs outline-none"
            />
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="rounded-lg bg-[#111827] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            Save slide
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onDelete}
            className="rounded-lg border border-[#D0D5DD] px-2.5 py-2 text-xs font-semibold text-[#C01020] hover:border-[#C01020]"
            aria-label="Delete hero slide"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function Inspector({
  tab,
  selected,
  postUpdate,
  assets,
  uploadAsset,
  deleteAsset,
  onRefreshAssets,
}: {
  tab: "content" | "design";
  selected: SelectedElement | null;
  postUpdate: (payload: Record<string, unknown>) => void;
  assets: { id: string; path: string; publicUrl: string }[];
  uploadAsset: (file: File) => Promise<string>;
  deleteAsset: (path: string) => Promise<void>;
  onRefreshAssets: () => void;
}) {
  const [showOnMobile, setShowOnMobile] = useState(true);
  const [styleViewport, setStyleViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [mediaQuery, setMediaQuery] = useState("");
  const [mediaFolder, setMediaFolder] = useState("all");
  const [mediaLimit, setMediaLimit] = useState(9);
  const visibleAssets = assets
    .filter((asset) => mediaFolder === "all" || asset.path.startsWith(`${mediaFolder}/`))
    .filter((asset) => asset.path.toLowerCase().includes(mediaQuery.toLowerCase()))
    .slice(0, mediaLimit);

  if (!selected)
    return (
      <div className="grid min-h-[400px] place-items-center px-7 text-center">
        <div>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-[#F97316]">
            <MousePointer2 className="h-5 w-5" />
          </span>
          <p className="mt-4 text-sm font-semibold">Select something to edit</p>
          <p className="mt-2 text-xs leading-5 text-white/45">
            Click a heading, image, button, or section in the live canvas. Changes preview
            instantly.
          </p>
        </div>
      </div>
    );
  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#F97316]">
            Selected element
          </p>
          <p className="mt-2 font-mono text-[10px] leading-5 text-white/45">{selected.selector}</p>
        </div>
        <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] uppercase text-white/55">
          {selected.tag}
        </span>
      </div>
      {tab === "content" ? (
        <div className="mt-7 space-y-5">
          <div>
            <span className="mb-2 block text-xs font-semibold text-white/65">Quick format</span>
            <div className="grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-[#1F2937] p-1">
              {(
                [
                  ["Small", "fontSize", "0.9rem"],
                  ["Large", "fontSize", "1.25rem"],
                  ["Left", "textAlign", "left"],
                  ["Centre", "textAlign", "center"],
                ] as const
              ).map(([label, property, value]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => postUpdate({ css: { [property]: value } })}
                  className="rounded-lg px-2 py-2 text-[10px] font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-white/65">Visible copy</span>
            <textarea
              value={selected.text}
              onChange={(event) => postUpdate({ text: event.target.value })}
              className="min-h-28 w-full rounded-xl border border-white/10 bg-[#1F2937] px-3 py-3 text-sm text-white outline-none focus:border-[#F97316]"
            />
          </label>
          {selected.tag === "img" ? (
            <div className="space-y-3">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-white/65">Image source</span>
                <input
                  defaultValue={selected.image ?? ""}
                  onBlur={(event) => postUpdate({ image: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#1F2937] px-3 py-3 text-xs text-white outline-none focus:border-[#F97316]"
                />
              </label>
              <div>
                <span className="mb-2 block text-xs font-semibold text-white/65">
                  Media library
                </span>
                <div className="mb-2 grid grid-cols-[1fr_auto] gap-2">
                  <input
                    value={mediaQuery}
                    onChange={(event) => setMediaQuery(event.target.value)}
                    placeholder="Search media"
                    className="rounded-lg border border-white/10 bg-[#1F2937] px-2.5 py-2 text-xs text-white outline-none focus:border-[#F97316]"
                    aria-label="Search media library"
                  />
                  <select
                    value={mediaFolder}
                    onChange={(event) => setMediaFolder(event.target.value)}
                    className="rounded-lg border border-white/10 bg-[#1F2937] px-2 py-2 text-xs text-white outline-none"
                    aria-label="Filter media folder"
                  >
                    <option value="all">All</option>
                    <option value="media">Media</option>
                    <option value="products">Products</option>
                    <option value="branding">Branding</option>
                  </select>
                </div>
                <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto">
                  {visibleAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="group relative overflow-hidden rounded-lg border border-white/10"
                    >
                      <button
                        type="button"
                        onClick={() => postUpdate({ image: asset.publicUrl })}
                        className="block w-full transition hover:opacity-80"
                        title={asset.path}
                      >
                        <img
                          src={asset.publicUrl}
                          alt=""
                          className="aspect-square w-full object-cover"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm("Delete this media asset?")) return;
                          const toastId = toast.loading("Deleting image...");
                          try {
                            await deleteAsset(asset.path);
                            toast.success("Image deleted", { id: toastId });
                          } catch (error) {
                            toast.error(
                              error instanceof Error ? error.message : "Could not delete image",
                              { id: toastId },
                            );
                          }
                        }}
                        className="absolute right-1 top-1 hidden rounded-md bg-red-500/90 p-1 text-white group-hover:block"
                        aria-label={`Delete ${asset.path}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                {visibleAssets.length < assets.length ? (
                  <button
                    type="button"
                    onClick={() => setMediaLimit((limit) => limit + 9)}
                    className="mt-2 w-full rounded-lg border border-white/10 px-2 py-2 text-[10px] text-white/55 hover:border-[#F97316] hover:text-white"
                  >
                    Load more media
                  </button>
                ) : null}
                <label className="mt-3 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/15 px-3 py-3 text-xs text-white/60 hover:border-[#F97316] hover:text-white">
                  Upload image
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (event) => {
                      const file = event.currentTarget.files?.[0];
                      if (!file) return;
                      const toastId = toast.loading(`Uploading ${file.name}...`);
                      try {
                        const publicUrl = await uploadAsset(file);
                        postUpdate({ image: publicUrl });
                        toast.success("Image uploaded", { id: toastId });
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "Could not upload image",
                          { id: toastId },
                        );
                      }
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={onRefreshAssets}
                  className="mt-2 text-[10px] text-white/40 hover:text-white"
                >
                  Refresh media
                </button>
              </div>
            </div>
          ) : null}
          {selected.tag === "a" || selected.tag === "button" ? (
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-white/65">Link target</span>
              <input
                defaultValue={selected.href ?? ""}
                onBlur={(event) => postUpdate({ href: event.target.value })}
                placeholder="/contact or https://…"
                className="w-full rounded-xl border border-white/10 bg-[#1F2937] px-3 py-3 text-xs text-white outline-none focus:border-[#F97316]"
              />
            </label>
          ) : null}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#1F2937] px-3 py-3">
            <div>
              <p className="text-xs font-semibold text-white/75">Show on mobile</p>
              <p className="mt-1 text-[10px] text-white/40">
                Keep this element visible below 768px.
              </p>
            </div>
            <Toggle
              checked={showOnMobile}
              label="Toggle mobile visibility"
              onChange={(checked) => {
                setShowOnMobile(checked);
                postUpdate({ css: { display: checked ? "" : "none" } });
              }}
            />
          </div>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-white/65">SEO / meta label</span>
            <input
              defaultValue={selected.text}
              onBlur={(event) => postUpdate({ meta: { label: event.target.value } })}
              className="w-full rounded-xl border border-white/10 bg-[#1F2937] px-3 py-3 text-xs text-white outline-none focus:border-[#F97316]"
            />
          </label>
          <div className="rounded-xl bg-white/5 p-3 text-xs leading-5 text-white/45">
            Live preview mode is active. Publish the draft after the page is approved.
          </div>
        </div>
      ) : (
        <div className="mt-7 space-y-5">
          <div>
            <span className="mb-2 block text-xs font-semibold text-white/65">
              Responsive breakpoint
            </span>
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-[#1F2937] p-1">
              {(["desktop", "tablet", "mobile"] as const).map((breakpoint) => (
                <button
                  key={breakpoint}
                  type="button"
                  onClick={() => setStyleViewport(breakpoint)}
                  className={`rounded-lg px-2 py-2 text-[10px] font-semibold capitalize ${styleViewport === breakpoint ? "bg-white text-[#111827]" : "text-white/55 hover:text-white"}`}
                >
                  {breakpoint}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-white/65">Text color</span>
            <input
              type="color"
              onChange={(event) =>
                postUpdate(
                  styleViewport === "desktop"
                    ? { css: { color: event.target.value } }
                    : { responsive: { [styleViewport]: { color: event.target.value } } },
                )
              }
              className="h-10 w-full cursor-pointer rounded-lg bg-transparent"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-white/65">Background token</span>
            <input
              type="color"
              onChange={(event) =>
                postUpdate(
                  styleViewport === "desktop"
                    ? { css: { backgroundColor: event.target.value } }
                    : { responsive: { [styleViewport]: { backgroundColor: event.target.value } } },
                )
              }
              className="h-10 w-full cursor-pointer rounded-lg bg-transparent"
            />
          </label>
          <label className="block">
            <span className="mb-2 flex items-center justify-between text-xs font-semibold text-white/65">
              Padding <span className="font-mono text-[10px] text-white/40">8px</span>
            </span>
            <input
              type="range"
              min="0"
              max="80"
              defaultValue="8"
              onChange={(event) =>
                postUpdate(
                  styleViewport === "desktop"
                    ? { css: { padding: `${event.target.value}px` } }
                    : { responsive: { [styleViewport]: { padding: `${event.target.value}px` } } },
                )
              }
              className="w-full accent-[#10B981]"
            />
          </label>
          <label className="block">
            <span className="mb-2 flex items-center justify-between text-xs font-semibold text-white/65">
              Margin <span className="font-mono text-[10px] text-white/40">0px</span>
            </span>
            <input
              type="range"
              min="0"
              max="80"
              defaultValue="0"
              onChange={(event) =>
                postUpdate(
                  styleViewport === "desktop"
                    ? { css: { marginBlock: `${event.target.value}px` } }
                    : {
                        responsive: { [styleViewport]: { marginBlock: `${event.target.value}px` } },
                      },
                )
              }
              className="w-full accent-[#10B981]"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-white/65">Corner radius</span>
            <input
              type="range"
              min="0"
              max="32"
              defaultValue="12"
              onChange={(event) =>
                postUpdate(
                  styleViewport === "desktop"
                    ? { css: { borderRadius: `${event.target.value}px` } }
                    : {
                        responsive: {
                          [styleViewport]: { borderRadius: `${event.target.value}px` },
                        },
                      },
                )
              }
              className="w-full accent-[#10B981]"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-white/65">Font scale</span>
            <input
              type="range"
              min="80"
              max="140"
              defaultValue="100"
              onChange={(event) =>
                postUpdate(
                  styleViewport === "desktop"
                    ? { css: { fontSize: `${event.target.value}%` } }
                    : { responsive: { [styleViewport]: { fontSize: `${event.target.value}%` } } },
                )
              }
              className="w-full accent-[#10B981]"
            />
          </label>
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

function QuickAction({
  href,
  icon: Icon,
  label,
  detail,
}: {
  href: string;
  icon: typeof MessageCircle;
  label: string;
  detail: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 transition-colors hover:border-[#FF7A00]/40 hover:bg-[#FF7A00]/[0.07]"
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.06] text-[#FF9500]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold text-white">{label}</span>
        <span className="mt-1 block truncate text-[11px] text-[#64748B]">{detail}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 text-[#64748B] transition-colors group-hover:text-[#FF9500]" />
    </a>
  );
}

function BlockCard({
  block,
  index,
  total,
  onMove,
  onSave,
  onDuplicate,
  onDelete,
  onToggle,
  onAddChild,
}: {
  block: Block;
  index: number;
  total: number;
  onMove: (index: number, direction: -1 | 1) => void;
  onSave: (block: Block) => void;
  onDuplicate: (block: Block) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, visible: boolean) => void;
  onAddChild: (id: string, kind: PageBlock["kind"]) => void;
}) {
  return (
    <article
      className={`rounded-xl border p-3 ${block.is_visible ? "border-[#E4E7EC] bg-white" : "border-dashed border-[#D0D5DD] bg-[#F8F9FA]"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#F2F4F7] text-[10px] font-semibold text-[#667085]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[#344054]">{block.name}</p>
            <p className="mt-1 truncate font-mono text-[9px] uppercase tracking-[0.1em] text-[#98A2B3]">
              {block.key}
            </p>
          </div>
        </div>
        <Toggle
          label={`Toggle ${block.name}`}
          checked={block.is_visible}
          onChange={(visible) => onToggle(block.id, visible)}
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-1">
        <div className="flex gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
            className="rounded-md p-1.5 text-[#98A2B3] hover:bg-[#F2F4F7] disabled:opacity-30"
            aria-label="Move block up"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(index, 1)}
            className="rounded-md p-1.5 text-[#98A2B3] hover:bg-[#F2F4F7] disabled:opacity-30"
            aria-label="Move block down"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onDuplicate(block)}
            className="rounded-md p-1.5 text-[#98A2B3] hover:bg-[#EAF7EF] hover:text-[#208454]"
            aria-label="Duplicate block"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(block.id)}
            className="rounded-md p-1.5 text-[#98A2B3] hover:bg-[#FDECEE] hover:text-[#C3121F]"
            aria-label="Delete block"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSave(block)}
            className="rounded-md p-1.5 text-[#98A2B3] hover:bg-[#EAF7EF] hover:text-[#208454]"
            aria-label="Save block"
          >
            <Save className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {block.kind === "container" || block.kind === "columns" ? (
        <button
          type="button"
          onClick={() => onAddChild(block.id, "rich_text")}
          className="mt-3 w-full rounded-lg border border-dashed border-[#D0D5DD] px-2 py-2 text-[10px] font-semibold text-[#667085] hover:border-[#FF7A00] hover:text-[#B54708]"
        >
          + Add child block
        </button>
      ) : null}
    </article>
  );
}
