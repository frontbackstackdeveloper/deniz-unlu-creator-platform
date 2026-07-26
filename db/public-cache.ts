type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const entries = new Map<string, CacheEntry<unknown>>();
const pending = new Map<string, Promise<unknown>>();

export async function getCachedPublicData<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
): Promise<T> {
  const cached = entries.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const activeRequest = pending.get(key) as Promise<T> | undefined;
  if (activeRequest) return activeRequest;

  const request = load()
    .then((value) => {
      entries.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      });
      return value;
    })
    .catch((error) => {
      if (cached) return cached.value;
      throw error;
    })
    .finally(() => {
      pending.delete(key);
    });

  pending.set(key, request);
  return request;
}

export function invalidatePublicData(key: string) {
  entries.delete(key);
  pending.delete(key);
}
