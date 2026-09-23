import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Line, LineChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from "recharts";
import {
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Mail,
  MessageCircle,
  MousePointer2,
  Package,
  Palette,
  Search,
  Sparkles,
} from "lucide-react";
import {
  getDashboardMetrics,
  listLeads,
  listProducts,
  listWhatsappLeads,
} from "@/lib/admin.functions";
import {
  AdminPage,
  AdminError,
  AdminLoading,
  EmptyState,
  MetricCard,
  Panel,
  PanelHeading,
  StatusPill,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/")({ component: OverviewDashboard });

const rangeTabs = [
  { days: 7, label: "7d" },
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
];

type VelocityPoint = { day: string; clicks: number; leads: number };
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
  name: string;
  product_title: string;
  status: string;
  created_at: string;
};
type DashboardProduct = {
  id: string;
  title: string;
  category: string;
  price_from: number;
  image_url: string | null;
  images: string[];
  featured: boolean;
  active: boolean;
};

function VelocityTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: { dataKey?: string; value?: number }[];
}) {
  if (!active || !payload?.length) return null;
  const clicks = payload.find((p) => p.dataKey === "clicks")?.value ?? 0;
  const leads = payload.find((p) => p.dataKey === "leads")?.value ?? 0;
  return (
    <div className="rounded-xl bg-[#111827] px-4 py-3 text-white shadow-xl">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">{label}</p>
      <p className="mt-1.5 text-xs text-white/90">
        <span className="font-semibold text-white">{clicks}</span> clicks
      </p>
      <p className="text-xs text-white/90">
        <span className="font-semibold text-white">{leads}</span> leads
      </p>
    </div>
  );
}

function OverviewDashboard() {
  const metricsFn = useServerFn(getDashboardMetrics);
  const whatsappFn = useServerFn(listWhatsappLeads);
  const formLeadsFn = useServerFn(listLeads);
  const productsFn = useServerFn(listProducts);
  const [rangeDays, setRangeDays] = useState(30);
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  const metrics = useQuery({
    queryKey: ["dashboard-metrics", rangeDays],
    queryFn: () => metricsFn({ data: { days: rangeDays } }),
    refetchInterval: 60_000,
  });
  const whatsappLeads = useQuery({
    queryKey: ["overview-whatsapp"],
    queryFn: () => whatsappFn({}),
  });
  const formLeads = useQuery({ queryKey: ["overview-form-leads"], queryFn: () => formLeadsFn({}) });
  const products = useQuery({ queryKey: ["overview-products"], queryFn: () => productsFn({}) });

  if (metrics.isPending) {
    return (
      <AdminPage eyebrow="Overview" title="Your storefront at a glance." description="Loading…">
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
        title="Signals are unavailable."
        description="The dashboard could not load storefront data."
      >
        <Panel>
          <AdminError
            detail={metrics.error instanceof Error ? metrics.error.message : "Please try again."}
            onRetry={() => void metrics.refetch()}
          />
        </Panel>
      </AdminPage>
    );
  }

  const metric = metrics.data;
  const velocityDelta = (key: "clicks" | "leads") => {
    const days = metric.velocity;
    if (days.length < 6) return undefined;
    const recent = days.slice(-3).reduce((s, d) => s + d[key], 0);
    const prior = days.slice(-6, -3).reduce((s, d) => s + d[key], 0);
    if (recent === 0 && prior === 0) return undefined;
    if (prior === 0) return { direction: "up" as const, label: "new activity" };
    const change = Math.round(((recent - prior) / prior) * 100);
    if (change === 0) return { direction: "flat" as const, label: "steady" };
    return {
      direction: change > 0 ? ("up" as const) : ("down" as const),
      label: `${Math.abs(change)}% vs prior 3d`,
    };
  };

  const activities: Activity[] = [
    ...((formLeads.data ?? []) as FormLead[]).map((lead) => ({
      id: `form-${lead.id}`,
      name: lead.name || lead.company || "Website enquiry",
      detail: lead.service || lead.email,
      status: lead.status,
      created_at: lead.created_at,
      kind: "form" as const,
    })),
    ...((whatsappLeads.data ?? []) as WhatsappLead[]).map((lead) => ({
      id: `wa-${lead.id}`,
      name: lead.name || "WhatsApp enquiry",
      detail: lead.product_title || "General quote",
      status: lead.status,
      created_at: lead.created_at,
      kind: "whatsapp" as const,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  const activeProducts = ((products.data ?? []) as DashboardProduct[]).filter((p) => p.active);
  const featured = activeProducts.filter((p) => p.featured);
  const shortlist = featured.length ? featured : activeProducts;
  const spotlight = shortlist.length ? shortlist[spotlightIndex % shortlist.length] : undefined;
  const spotlightImage = spotlight?.image_url || spotlight?.images?.[0] || null;

  const clicksDelta = velocityDelta("clicks");

  return (
    <AdminPage
      eyebrow="Overview"
      title="Look at your store"
      description="Real customer signals recorded by the storefront, updated live."
      action={<StatusPill status="Tracked signals" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tracked clicks"
          value={metric.totalClicks.toLocaleString()}
          detail={`Last ${rangeDays} days`}
          icon={MousePointer2}
          tone="ink"
          delta={velocityDelta("clicks")}
        />
        <MetricCard
          label="Lead enquiries"
          value={metric.totalLeads.toLocaleString()}
          detail="Forms and WhatsApp"
          icon={MessageCircle}
          tone="green"
          delta={velocityDelta("leads")}
        />
        <MetricCard
          label="Top category"
          value={metric.topCategory.name}
          detail="By tracked activity"
          icon={Palette}
          tone="blue"
        />
        <MetricCard
          label="Won rate"
          value={`${metric.conversionRate}%`}
          detail="From recorded leads"
          icon={Check}
          tone="amber"
        />
      </div>

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#F3F4F6] px-5 py-4 md:px-6">
          <div>
            <h2 className="text-sm font-semibold text-[#111827]">Your storefront report</h2>
            <p className="mt-0.5 text-xs text-[#6B7280]">Look at your live customer signals</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-[#6B7280]">
              <span className="h-2 w-2 rounded-full bg-[#111827]" aria-hidden="true" /> Clicks
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[#6B7280]">
              <span className="h-2 w-2 rounded-full bg-[#ED1D2B]" aria-hidden="true" /> Leads
            </span>
          </div>
        </div>
        <div className="p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-3xl font-semibold tracking-[-0.04em] text-[#111827]">
                {metric.totalClicks.toLocaleString()}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                {clicksDelta ? (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      clicksDelta.direction === "up"
                        ? "text-[#166534]"
                        : clicksDelta.direction === "down"
                          ? "text-[#991B1B]"
                          : "text-[#6B7280]"
                    }`}
                  >
                    {clicksDelta.direction === "up"
                      ? "▲"
                      : clicksDelta.direction === "down"
                        ? "▼"
                        : "▬"}
                    {clicksDelta.label}
                  </span>
                ) : null}
                <span className="text-xs text-[#9CA3AF]">total customer signals</span>
              </div>
            </div>
            <div
              role="tablist"
              aria-label="Chart date range"
              className="inline-flex rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-1"
            >
              {rangeTabs.map((tab) => (
                <button
                  key={tab.days}
                  type="button"
                  role="tab"
                  aria-selected={rangeDays === tab.days}
                  onClick={() => setRangeDays(tab.days)}
                  className={`min-h-9 rounded-lg px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B] ${
                    rangeDays === tab.days
                      ? "bg-[#111827] text-white"
                      : "text-[#6B7280] hover:text-[#111827]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 h-64 w-full">
            {metric.velocity.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={metric.velocity as VelocityPoint[]}
                  margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
                >
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    interval={Math.max(0, Math.ceil(rangeDays / 7) - 1)}
                    tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  />
                  <RechartsTooltip content={<VelocityTooltip />} cursor={{ stroke: "#E5E7EB" }} />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="#111827"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    stroke="#ED1D2B"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#9CA3AF]">
                No activity recorded yet for this range.
              </div>
            )}
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <Panel className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F3F4F6] px-5 py-4 md:px-6">
            <h2 className="text-sm font-semibold text-[#111827]">Last enquiries</h2>
            <div className="flex items-center gap-2">
              <label className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 text-[#9CA3AF]">
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
                <input
                  aria-label="Search enquiries"
                  placeholder="Search"
                  className="w-24 bg-transparent text-xs text-[#111827] outline-none placeholder:text-[#9CA3AF]"
                />
              </label>
              <button
                type="button"
                aria-label="Filter"
                className="grid h-9 w-9 place-items-center rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB]"
              >
                <Filter className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <Link
                to="/admin/leads"
                className="hidden min-h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EB] px-3 text-xs font-semibold text-[#111827] transition-colors hover:bg-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B] sm:flex"
              >
                View all
              </Link>
            </div>
          </div>
          {formLeads.isPending || whatsappLeads.isPending ? (
            <AdminLoading label="Loading recent enquiries" />
          ) : activities.length === 0 ? (
            <EmptyState
              title="No enquiries yet"
              detail="New form and WhatsApp activity will appear here."
            />
          ) : (
            <>
              <div className="hidden grid-cols-[1.4fr_1.4fr_1fr_1fr] gap-3 border-b border-[#F3F4F6] px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF] md:grid">
                <span>Contact</span>
                <span>Detail</span>
                <span>Date</span>
                <span>Status</span>
              </div>
              <div className="divide-y divide-[#F3F4F6]">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 px-5 py-3.5 md:px-6">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                        activity.kind === "whatsapp"
                          ? "bg-[#DCFCE7] text-[#166534]"
                          : "bg-[#DBEAFE] text-[#1E40AF]"
                      }`}
                    >
                      {activity.kind === "whatsapp" ? (
                        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#111827]">
                        {activity.name}
                      </p>
                      <p className="truncate text-xs text-[#6B7280] md:hidden">{activity.detail}</p>
                    </div>
                    <div className="hidden min-w-0 flex-1 truncate text-xs text-[#6B7280] md:block">
                      {activity.detail}
                    </div>
                    <div className="hidden shrink-0 text-xs text-[#9CA3AF] sm:block">
                      {new Date(activity.created_at).toLocaleDateString("en-KE", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <StatusPill status={activity.status} />
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeading
            icon={Sparkles}
            title="Featured on your storefront"
            detail="Your best products, ready to browse"
          />
          {products.isPending ? (
            <AdminLoading label="Loading catalog" />
          ) : !spotlight ? (
            <EmptyState
              title="No active products"
              detail="Add one in Catalog to feature it here."
            />
          ) : (
            <div className="p-5">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#F3F4F6]">
                {spotlightImage ? (
                  <img src={spotlightImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-[#9CA3AF]">
                    <Package className="h-8 w-8" aria-hidden="true" />
                  </div>
                )}
                {shortlist.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setSpotlightIndex((i) => (i - 1 + shortlist.length) % shortlist.length)
                      }
                      aria-label="Previous product"
                      className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#111827] shadow hover:bg-white"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpotlightIndex((i) => (i + 1) % shortlist.length)}
                      aria-label="Next product"
                      className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#111827] shadow hover:bg-white"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </>
                ) : null}
              </div>
              <p className="mt-4 truncate text-sm font-semibold text-[#111827]">
                {spotlight.title}
              </p>
              <p className="mt-1 truncate text-xs text-[#6B7280]">{spotlight.category}</p>
              <p className="mt-2 text-lg font-semibold text-[#ED1D2B]">
                KES {spotlight.price_from.toLocaleString("en-KE")}
              </p>
              <Link
                to="/admin/catalog"
                className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-[#E5E7EB] px-4 text-xs font-semibold text-[#111827] transition-colors hover:bg-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1D2B]"
              >
                Manage catalog
              </Link>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#FEEDEC] text-[#ED1D2B]">
              <Package className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#111827]">
                {metric.activeProducts} active products
              </p>
              <p className="text-xs text-[#6B7280]">Visible to customers right now</p>
            </div>
          </div>
        </Panel>
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#DBEAFE] text-[#1E40AF]">
              <Briefcase className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#111827]">
                {metric.pendingLeads} leads need a reply
              </p>
              <p className="text-xs text-[#6B7280]">Pending WhatsApp inquiries</p>
            </div>
          </div>
        </Panel>
      </div>
    </AdminPage>
  );
}
