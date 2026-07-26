import { getChatGPTUser } from "../chatgpt-auth";

export async function getAdminSession() {
  const authenticatedUser = await getChatGPTUser();
  const configuredAdminEmail =
    process.env.ADMIN_EMAIL?.trim().toLocaleLowerCase("tr-TR") ?? "";
  const localTestEmail =
    process.env.LOCAL_ADMIN_TEST_EMAIL?.trim().toLocaleLowerCase("tr-TR") ?? "";
  const isConfigured = configuredAdminEmail.length > 0;
  const isLocalTestMode =
    process.env.NODE_ENV !== "production" &&
    isConfigured &&
    localTestEmail === configuredAdminEmail;
  const user =
    authenticatedUser ??
    (isLocalTestMode
      ? {
          displayName: "Tamer / Deniz · Yerel test",
          email: configuredAdminEmail,
          fullName: "Tamer / Deniz",
        }
      : null);
  const isAdmin =
    Boolean(user) &&
    isConfigured &&
    user?.email.toLocaleLowerCase("tr-TR") === configuredAdminEmail;

  return {
    user,
    isConfigured,
    isAdmin,
    isLocalTestMode,
  };
}
