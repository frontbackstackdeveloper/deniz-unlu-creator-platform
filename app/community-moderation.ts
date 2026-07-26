const blockedWords = [
  "amk",
  "aq",
  "amina",
  "aminakoyim",
  "aminakoyayim",
  "siktir",
  "sik",
  "sikeyim",
  "sikerim",
  "sikik",
  "yarrak",
  "yarak",
  "orospu",
  "pic",
  "got",
  "gotveren",
  "ibne",
  "pezevenk",
  "pust",
  "dalyarak",
] as const;

function normalizeCommunityText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[013457@$!]/g, (character) => {
      const replacements: Record<string, string> = {
        "0": "o",
        "1": "i",
        "3": "e",
        "4": "a",
        "5": "s",
        "7": "t",
        "@": "a",
        "$": "s",
        "!": "i",
      };
      return replacements[character] ?? character;
    })
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u");
}

export function containsBlockedCommunityLanguage(...values: string[]) {
  const normalized = normalizeCommunityText(values.join(" "));
  const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  const compact = normalized.replace(/[^a-z0-9]/g, "");

  return blockedWords.some(
    (word) =>
      tokens.includes(word) ||
      (word.length >= 6 && compact.includes(word)),
  );
}
