import type { Locale } from "@/lib/locale";

export type ProductNavId =
  | "home"
  | "signals"
  | "matches"
  | "messages"
  | "profile";

export type ProductNavItem = {
  id: ProductNavId;
  href: string;
  labelKey: string;
  show: "always" | "md";
  authOnly?: boolean;
  matches: string[];
};

export const PRODUCT_NAV_ITEMS: ProductNavItem[] = [
  { id: "home", href: "/", labelKey: "nav.home", show: "always", matches: ["/"] },
  { id: "signals", href: "/semnale", labelKey: "nav.signals", show: "always", matches: ["/semnale", "/semnal"] },
  { id: "matches", href: "/potriviri", labelKey: "nav.matches", show: "always", matches: ["/potriviri"] },
  { id: "messages", href: "/mesaje", labelKey: "nav.messages", show: "always", authOnly: true, matches: ["/mesaje"] },
  { id: "profile", href: "/profil", labelKey: "layout.profile", show: "always", authOnly: true, matches: ["/profil"] },
];

export function isNavItemActive(item: ProductNavItem, location: string): boolean {
  const [path] = location.split("?");

  if (item.id === "home") {
    return path === "/";
  }

  return item.matches.some((prefix) => {
    if (prefix === "/") return path === "/";
    return path === prefix || path.startsWith(`${prefix}/`);
  });
}

export function getDefaultHomePath(_locale: Locale): string {
  return "/";
}
