"use client";

import { useState, type ReactNode } from "react";

export function AdminTabs({ community, content }: { community: ReactNode; content: ReactNode }) {
  const [active, setActive] = useState<1 | 2>(1);

  return (
    <div className="admin-tabs">
      <nav className="admin-tabs__nav" aria-label="Yönetim paneli bölümleri">
        <button type="button" aria-current={active === 1 ? "page" : undefined} onClick={() => setActive(1)}>
          <span>01</span><strong>Çekiliş ve topluluk</strong>
        </button>
        <button type="button" aria-current={active === 2 ? "page" : undefined} onClick={() => setActive(2)}>
          <span>02</span><strong>Yayın, videolar ve sunucular</strong>
        </button>
      </nav>
      <div className="admin-tabs__panel" hidden={active !== 1}>{community}</div>
      <div className="admin-tabs__panel" hidden={active !== 2}>{content}</div>
    </div>
  );
}
