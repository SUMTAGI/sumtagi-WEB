const KEY = "recently_viewed_islands";
const MAX = 6;

export interface RecentIsland {
  id: string;
  name: string;
  image: string | null;
  viewedAt: number;
}

export const recentlyViewedService = {
  record(island: { id: string; name: string; image: string | null }) {
    try {
      const list: RecentIsland[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      const next = [
        { ...island, viewedAt: Date.now() },
        ...list.filter((i) => i.id !== island.id),
      ].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // localStorage 접근 불가(프라이빗 모드 등) 시 조용히 무시
    }
  },

  getRecent(limit = 4): RecentIsland[] {
    try {
      const list: RecentIsland[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      return list.slice(0, limit);
    } catch {
      return [];
    }
  },
};
