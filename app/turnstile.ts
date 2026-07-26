const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileResponse = {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export async function verifyTurnstileToken(
  token: string,
  request: Request,
  expectedAction = "giveaway_entry",
): Promise<{ success: boolean; configurationMissing?: boolean }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";
  if (!secret) return { success: false, configurationMissing: true };
  if (!token || token.length > 2048) return { success: false };

  const remoteIp = request.headers.get("cf-connecting-ip")?.trim();
  const body: Record<string, string> = {
    secret,
    response: token,
    idempotency_key: crypto.randomUUID(),
  };
  if (remoteIp) body.remoteip = remoteIp;

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return { success: false };

    const result = (await response.json()) as TurnstileResponse;
    const actionMatches =
      !result.action || result.action === expectedAction;

    return { success: result.success === true && actionMatches };
  } catch {
    return { success: false };
  }
}
