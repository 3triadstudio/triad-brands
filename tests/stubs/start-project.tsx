import type { ReactNode } from "react";

export function StartProjectDialog({ children }: { children: ReactNode }) {
  return <button type="button">{children}</button>;
}
