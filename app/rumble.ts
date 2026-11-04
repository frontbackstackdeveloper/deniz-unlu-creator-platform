export function rumbleEmbedUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["rumble.com", "www.rumble.com"].includes(url.hostname)) return null;
    const match = url.pathname.match(/^\/embed\/(v[a-z0-9]+)\/?$/i);
    return match ? `https://rumble.com/embed/${match[1]}/` : null;
  } catch {
    return null;
  }
}
