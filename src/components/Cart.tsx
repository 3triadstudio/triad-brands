import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  cartEstimate,
  cartQuantity,
  getCartItemKey,
  useCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
} from "@/lib/cart";
import { formatKES } from "@/lib/catalog-data";
import { StartProjectDialog } from "@/components/StartProjectDialog";

export function Cart() {
  const items = useCart();

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Shopping cart"
        className="relative grid min-h-11 min-w-11 place-items-center rounded-lg text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <ShoppingBag className="h-4.5 w-4.5" />
        {items.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-accent text-[0.625rem] font-medium text-accent-foreground">
            {items.length}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] rounded-xl p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="label-mono text-muted-foreground">Quote shortlist</p>
          {items.length ? (
            <span className="text-xs text-muted-foreground">{cartQuantity(items)} items</span>
          ) : null}
        </div>
        {items.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Nothing added yet. Add items from the catalog to request a quote.
          </p>
        ) : (
          <>
            <ul className="mt-4 space-y-3">
              {items.map((i) => (
                <li key={getCartItemKey(i)} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-medium">{i.title}</span>
                    <span className="label-mono text-muted-foreground">
                      From {formatKES(i.from * (i.quantity ?? 1))}
                    </span>
                    {i.size || i.color ? (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {[i.size, i.color].filter(Boolean).join(" · ")}
                      </span>
                    ) : null}
                    <div className="mt-2 inline-flex items-center rounded-lg border border-border">
                      <button
                        type="button"
                        aria-label={`Decrease ${i.title} quantity`}
                        onClick={() =>
                          updateCartQuantity(getCartItemKey(i), Math.max(1, (i.quantity ?? 1) - 1))
                        }
                        className="grid h-8 w-8 place-items-center text-muted-foreground hover:bg-muted"
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <span className="min-w-8 text-center text-xs font-semibold">
                        {i.quantity ?? 1}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase ${i.title} quantity`}
                        onClick={() => updateCartQuantity(getCartItemKey(i), (i.quantity ?? 1) + 1)}
                        className="grid h-8 w-8 place-items-center text-muted-foreground hover:bg-muted"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${i.title}`}
                    onClick={() => removeFromCart(getCartItemKey(i))}
                    className="grid min-h-9 min-w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Starting estimate</span>
              <span className="font-semibold">{formatKES(cartEstimate(items))}</span>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <StartProjectDialog
                quoteItems={items}
                className="min-h-11 flex-1 rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                <>Request quote</>
              </StartProjectDialog>
              <button
                type="button"
                onClick={clearCart}
                className="label-mono rounded-full border border-border px-3 py-2.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                Clear
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
