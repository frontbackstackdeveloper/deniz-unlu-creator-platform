export const communityCategories = ["tartisma", "fikir", "oneri"] as const;
export const communityStatuses = ["pending", "approved", "rejected"] as const;

export type CommunityCategory = (typeof communityCategories)[number];
export type CommunityStatus = (typeof communityStatuses)[number];

export type CommunityMessage = {
  id: number;
  parentId: number | null;
  category: CommunityCategory;
  displayName: string;
  title: string;
  body: string;
  status: CommunityStatus;
  createdAt: string;
  reviewedAt: string | null;
};

export type CommunityThread = CommunityMessage & {
  replies: CommunityMessage[];
};

export type CommunityPageData = {
  threads: CommunityThread[];
  page: number;
  pageSize: number;
  totalThreads: number;
  totalPages: number;
};

export function communityCategoryLabel(category: CommunityCategory) {
  if (category === "fikir") return "Fikir";
  if (category === "oneri") return "Öneri";
  return "Tartışma";
}

export function communityStatusLabel(status: CommunityStatus) {
  if (status === "approved") return "Yayında";
  if (status === "rejected") return "Reddedildi";
  return "Onay bekliyor";
}
