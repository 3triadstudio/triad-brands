/**
 * Which prop a widget's on-canvas text maps back to.
 *
 * Double-clicking a widget edits this prop in place; anything not listed here
 * is edited through the inspector instead.
 */
export const inlineTextProp: Record<string, string> = {
  heading: "text",
  text: "text",
  eyebrow: "text",
  button: "label",
  form: "label",
};

export function inlineEditableProp(type: string): string | null {
  return inlineTextProp[type] ?? null;
}

/** The node inside a rendered widget that actually carries the text. */
export function findTextNode(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>("h1, h2, h3, h4, p, span, a");
}
