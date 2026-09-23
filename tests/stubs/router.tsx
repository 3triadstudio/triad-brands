/* eslint-disable react-refresh/only-export-components -- module stub, not a component file */
/** Minimal stand-ins so widgets can be rendered outside a router. */
import type { ReactNode } from "react";

export function Link({ children, ...rest }: { children?: ReactNode } & Record<string, unknown>) {
  return <a {...(rest as Record<string, never>)}>{children}</a>;
}
export const useRouter = () => ({ invalidate: () => {} });
export const useLocation = () => ({ pathname: "/" });
export const createFileRoute = () => () => ({});
