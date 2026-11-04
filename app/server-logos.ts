import { env } from "cloudflare:workers";

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
export const MAX_SERVER_LOGO_BYTES = 2 * 1024 * 1024;

export function getServerLogoBucket() {
  if (!env.BUCKET) throw new Error("Görsel depolaması henüz yapılandırılmadı.");
  return env.BUCKET;
}

export function validateServerLogo(bytes: Uint8Array) {
  if (bytes.length < 33 || bytes.length > MAX_SERVER_LOGO_BYTES) {
    throw new Error("PNG görseli 2 MB veya daha küçük olmalı.");
  }
  if (!PNG_SIGNATURE.every((value, index) => bytes[index] === value)) {
    throw new Error("Yalnızca gerçek PNG dosyası yüklenebilir.");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    view.getUint32(8) !== 13 ||
    String.fromCharCode(...bytes.slice(12, 16)) !== "IHDR"
  ) {
    throw new Error("PNG dosyası bozuk veya geçersiz.");
  }
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (width < 16 || height < 16 || width > 2048 || height > 2048) {
    throw new Error("PNG boyutları 16–2048 piksel arasında olmalı.");
  }
}
