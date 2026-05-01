export const ACCESS_COOKIE_NAME = "worktrack_access";
export type AccessRole = "owner" | "viewer";

export function getOwnerPassword(): string {
  return (
    process.env.APP_OWNER_PASSWORD?.trim() ||
    process.env.APP_ACCESS_PASSWORD?.trim() ||
    ""
  );
}

export function getViewerPassword(): string {
  return process.env.APP_VIEWER_PASSWORD?.trim() || "";
}

export function resolveRoleByPassword(password: string): AccessRole | null {
  if (!password) return null;
  const owner = getOwnerPassword();
  const viewer = getViewerPassword();

  if (owner && password === owner) return "owner";
  if (viewer && password === viewer) return "viewer";
  return null;
}

export function isAccessCookieValue(value: string | undefined): value is AccessRole {
  return value === "owner" || value === "viewer";
}
