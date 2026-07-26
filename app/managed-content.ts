import { siteContent } from "./content";

export const managedLinkKeys = [
  "live",
  "youtube",
  "kick",
  "tiktok",
  "discord",
  "whatsapp",
  "dailymotion",
] as const;

export type ManagedLinkKey = (typeof managedLinkKeys)[number];

export type ManagedSocialLink = {
  key: ManagedLinkKey;
  label: string;
  url: string;
  isActive: boolean;
  sortOrder: number;
};

export type ManagedServer = {
  id: number;
  name: string;
  code: string;
  status: string;
  detail: string;
  url: string;
  sortOrder: number;
  isVisible: boolean;
};

const linkLabels: Record<ManagedLinkKey, string> = {
  live: "Canlı yayın",
  youtube: "YouTube",
  kick: "Kick",
  tiktok: "TikTok",
  discord: "Discord",
  whatsapp: "WhatsApp",
  dailymotion: "Dailymotion",
};

export const defaultManagedLinks: ManagedSocialLink[] = managedLinkKeys.map(
  (key, index) => ({
    key,
    label: linkLabels[key],
    url: siteContent.links[key],
    isActive: siteContent.links[key].length > 0,
    sortOrder: index,
  }),
);

export const defaultManagedServers: ManagedServer[] = siteContent.servers.map(
  (server, index) => ({
    id: index + 1,
    name: server.name,
    code: server.code,
    status: server.status,
    detail: server.detail,
    url: server.url,
    sortOrder: index,
    isVisible: server.isVisible,
  }),
);

export function managedLinksToMap(links: ManagedSocialLink[]) {
  const fallback = Object.fromEntries(
    defaultManagedLinks.map((link) => [link.key, link.url]),
  ) as Record<ManagedLinkKey, string>;

  for (const link of links) {
    fallback[link.key] = link.isActive ? link.url : "";
  }

  return fallback;
}
