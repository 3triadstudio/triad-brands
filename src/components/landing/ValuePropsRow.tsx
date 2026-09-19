import { Factory, FileCheck2, Truck } from "lucide-react";
import type { CSSProperties } from "react";
import { valueProps } from "@/lib/catalog-data";

const icons = { factory: Factory, proof: FileCheck2, truck: Truck } as const;

export function ValuePropsRow({
  content = {},
  design = {},
  items = [],
}: {
  content?: Record<string, string>;
  design?: CSSProperties;
  items?: {
    id: string;
    label: string;
    description: string;
    visible?: boolean;
    sortOrder?: number;
  }[];
}) {
  const values = items.length
    ? items
        .filter((item) => item.visible !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((item, index) => ({
          ...valueProps[index % valueProps.length]!,
          title: item.label,
          body: item.description,
          id: item.id,
        }))
    : valueProps.map((value) => ({ ...value, id: value.title }));
  return (
    <section
      className="mx-auto max-w-[1400px] px-6 py-24 md:px-12 md:py-32"
      data-cms-block="value_props"
      style={design}
    >
      <div className="grid gap-10 md:grid-cols-3">
        {values.map((v, index) => {
          const Icon = icons[v.icon];
          return (
            <div key={v.id} className="border-t border-border pt-7">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-amber/15 text-foreground">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="display mt-7 text-2xl" data-cms-field={`value_props.${index}.title`}>
                {content[`value_props.${index}.title`] ?? v.title}
              </h3>
              <p
                className="mt-4 leading-relaxed text-muted-foreground"
                data-cms-field={`value_props.${index}.body`}
              >
                {content[`value_props.${index}.body`] ?? v.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
