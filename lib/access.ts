export const ACCESS_COOKIE_NAME = "worktrack_access";
export const ACCESS_COOKIE_VALUE = "granted";

export function getAccessPassword(): string {
  return process.env.APP_ACCESS_PASSWORD?.trim() || "";
}
