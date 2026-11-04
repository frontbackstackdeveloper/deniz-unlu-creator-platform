"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/yayin", desktop: "Canlı Yayın", mobile: "Canlı" },
  { href: "/videolar", desktop: "Videolar", mobile: "Videolar" },
  { href: "/arsiv", desktop: "Arşiv", mobile: "Arşiv" },
  { href: "/sunucular", desktop: "Sunucular", mobile: "Sunucular" },
  { href: "/cekilis", desktop: "Çekiliş", mobile: "Çekiliş" },
  { href: "/topluluk", desktop: "Topluluk", mobile: "Topluluk" },
] as const;

export function SiteNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className={mobile ? "mobile-nav" : undefined} aria-label={mobile ? "Mobil menü" : "Ana menü"}>
      {items.map(({ href, desktop, mobile: mobileLabel }) => (
        <Link
          href={href}
          key={href}
          aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined}
        >
          {mobile ? mobileLabel : desktop}
        </Link>
      ))}
    </nav>
  );
}
