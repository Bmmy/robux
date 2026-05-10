import { createServerFn } from "@tanstack/react-start";

type RobloxUser = {
  id: number;
  name: string;
  displayName: string;
  created: string;
  avatarUrl: string | null;
  hasVerifiedBadge?: boolean;
};

async function safeJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Roblox ${res.status} ${url}`);
  return res.json();
}

export const searchRobloxUser = createServerFn({ method: "GET" })
  .inputValidator((input: { query: string }) => ({
    query: String(input?.query ?? "").trim().slice(0, 60),
  }))
  .handler(async ({ data }): Promise<{ users: RobloxUser[] }> => {
    if (!data.query) return { users: [] };

    // Try exact username resolution first (fast path).
    let candidates: { id: number; name: string; displayName: string; hasVerifiedBadge?: boolean }[] = [];
    try {
      const exact = await safeJson("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [data.query], excludeBannedUsers: true }),
      });
      candidates = (exact?.data ?? []).map((u: any) => ({
        id: u.id,
        name: u.name,
        displayName: u.displayName,
        hasVerifiedBadge: u.hasVerifiedBadge,
      }));
    } catch {}

    // Fall back to fuzzy search.
    if (candidates.length === 0) {
      try {
        const search = await safeJson(
          `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(data.query)}&limit=10`
        );
        candidates = (search?.data ?? []).slice(0, 10).map((u: any) => ({
          id: u.id,
          name: u.name,
          displayName: u.displayName,
          hasVerifiedBadge: u.hasVerifiedBadge,
        }));
      } catch {}
    }

    if (candidates.length === 0) return { users: [] };

    const ids = candidates.map((c) => c.id);

    // Fetch full info (for created date) + avatar headshots in parallel.
    const [details, thumbs] = await Promise.all([
      Promise.all(
        ids.map((id) =>
          safeJson(`https://users.roblox.com/v1/users/${id}`).catch(() => null)
        )
      ),
      safeJson(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${ids.join(
          ","
        )}&size=150x150&format=Png&isCircular=false`
      ).catch(() => ({ data: [] })),
    ]);

    const thumbMap = new Map<number, string>();
    for (const t of thumbs?.data ?? []) {
      if (t?.targetId && t?.imageUrl) thumbMap.set(t.targetId, t.imageUrl);
    }

    const users: RobloxUser[] = candidates.map((c, i) => ({
      id: c.id,
      name: c.name,
      displayName: c.displayName,
      hasVerifiedBadge: c.hasVerifiedBadge,
      created: details[i]?.created ?? "",
      avatarUrl: thumbMap.get(c.id) ?? null,
    }));

    return { users };
  });

export const getRobloxAvatarFull = createServerFn({ method: "GET" })
  .inputValidator((input: { userId: number }) => ({ userId: Number(input.userId) }))
  .handler(async ({ data }): Promise<{ url: string | null }> => {
    try {
      const r = await safeJson(
        `https://thumbnails.roblox.com/v1/users/avatar?userIds=${data.userId}&size=420x420&format=Png&isCircular=false`
      );
      return { url: r?.data?.[0]?.imageUrl ?? null };
    } catch {
      return { url: null };
    }
  });
