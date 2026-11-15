import type { User } from "firebase/auth";

/** 後端與前端共用的提示文字 */
export const LOGIN_REQUIRED_MESSAGE = "請先用 Google 帳號登入才能使用";

/** 只有「Google 帳號登入」才算已登入（匿名登入不算） */
export function isGoogleUser(user: User | null | undefined): user is User {
  if (!user || user.isAnonymous) return false;
  return user.providerData.some((p) => p.providerId === "google.com");
}

/** 把 Firebase Auth 的錯誤代碼轉成老師看得懂的中文 */
export function describeAuthError(err: unknown): string | null {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: unknown }).code)
      : "";
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null; // 使用者自己關掉視窗，不用跳錯誤
    case "auth/popup-blocked":
      return "登入視窗被瀏覽器擋住了，請允許本網站開啟彈出視窗後再按一次。";
    case "auth/unauthorized-domain":
      return "這個網址尚未被允許使用 Google 登入，請通知管理員（阿凱老師）。";
    case "auth/operation-not-allowed":
    case "auth/configuration-not-found":
      return "網站的 Google 登入功能尚未開啟，請通知管理員（阿凱老師）。";
    case "auth/network-request-failed":
      return "網路連線不穩，請確認網路後再試一次。";
    case "auth/web-storage-unsupported":
      return "目前的瀏覽器不支援登入，請改用 Chrome 或 Safari 開啟本網站。";
    default:
      return "Google 登入失敗，請稍後再試；若在 LINE／FB 裡開啟，請改用 Chrome 或 Safari。";
  }
}
