export function getFallbackServerLogo(name: string) {
  const normalized = name.toLocaleLowerCase("tr-TR");
  if (normalized.includes("kuzey2")) return "/kuzey2-fetih.png";
  if (normalized.includes("rohan2")) return "https://rohan2.global/assets/images/logo.png";
  return "";
}
