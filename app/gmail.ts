export function normalizeGmailAddress(value: string) {
  const email = value.trim().toLowerCase();
  const match =
    /^([a-z0-9](?:[a-z0-9.]{0,62}[a-z0-9])?)@gmail\.com$/.exec(email);

  if (!match || match[1].includes("..")) return null;
  return email;
}
