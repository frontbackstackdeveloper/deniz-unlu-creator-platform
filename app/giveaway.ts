export const giveawayStatuses = [
  "draft",
  "active",
  "closed",
  "completed",
] as const;

export type GiveawayStatus = (typeof giveawayStatuses)[number];

export type Giveaway = {
  id: number;
  title: string;
  description: string;
  prize: string;
  status: GiveawayStatus;
  targetEntries: number;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
};

export type GiveawayEntry = {
  id: number;
  giveawayId: number;
  participantName: string;
  email: string;
  youtubeConfirmed: boolean;
  whatsappConfirmed: boolean;
  termsAccepted: boolean;
  status: "eligible" | "winner" | "disqualified";
  createdAt: string;
  updatedAt: string;
};

export type PublicGiveaway = Giveaway & {
  entryCount: number;
  isOpen: boolean;
  winnerDisplayName: string | null;
};

export type AdminGiveawayData = {
  giveaway: Giveaway | null;
  entries: GiveawayEntry[];
};

export function statusLabel(status: GiveawayStatus) {
  const labels: Record<GiveawayStatus, string> = {
    draft: "Taslak",
    active: "Katılıma açık",
    closed: "Katılım kapalı",
    completed: "Sonuçlandı",
  };

  return labels[status];
}

export function toDateTimeLocal(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function fromDateTimeLocal(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}
