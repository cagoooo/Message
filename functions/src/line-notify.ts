// functions/src/line-notify.ts
//
// LINE Messaging API 推播模組（Cloud Functions 端，純 push 模式）
//
// 設計原則：
//   1. fire-and-forget — 不阻擋使用者拿到 AI 回覆
//   2. token / userId 沒設或 = "DISABLED" → silent skip，不影響主流程
//   3. 失敗只 logger.warn，永不 throw 到呼叫端
//
// 用法：
//   import { notifyLine } from "./lib/line-notify";
//   notifyLine({ kind: "success", scenario, parentMessage, reply, mode: "generate" }, token, userId);
//
// Secrets 設定（一次性，在 ~/.claude/skills/line-messaging-firebase/SKILL.md 有完整 SOP）：
//   echo "<token>" | gcloud secrets versions add LINE_CHANNEL_ACCESS_TOKEN \
//     --data-file=- --project=teachers-ai-assistant-g4iph
//   echo "<userId>" | gcloud secrets versions add LINE_ADMIN_USER_ID \
//     --data-file=- --project=teachers-ai-assistant-g4iph

import { logger } from "firebase-functions";

const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

export type NotifyEvent =
  | {
      kind: "success";
      scenario: string;
      parentMessage: string;
      reply: string;
      mode?: "generate" | "refine";
      hasImage?: boolean;
      hasAdvanced?: boolean;
    }
  | {
      kind: "ai_error";
      scenario: string;
      parentMessage: string;
      errorMessage: string;
    }
  | {
      kind: "validation_error";
      errorMessage: string;
    };

const truncate = (text: string, max: number): string =>
  text.length <= max ? text : `${text.slice(0, max)}…`;

const formatTimestamp = (): string => {
  const now = new Date();
  const taipei = new Date(now.getTime() + 8 * 3600 * 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${taipei.getUTCFullYear()}-${pad(taipei.getUTCMonth() + 1)}-${pad(taipei.getUTCDate())} ` +
    `${pad(taipei.getUTCHours())}:${pad(taipei.getUTCMinutes())}`
  );
};

interface FlexMeta {
  title: string;
  headerColor: string;
  altText: string;
}

const META: Record<NotifyEvent["kind"], FlexMeta> = {
  success: {
    title: "✅ 親師回覆已產生",
    headerColor: "#10B981",
    altText: "教師回應小幫手：成功產生回覆",
  },
  ai_error: {
    title: "❌ AI 產生回覆失敗",
    headerColor: "#EF4444",
    altText: "教師回應小幫手：AI 失敗",
  },
  validation_error: {
    title: "⚠️ 表單驗證未通過",
    headerColor: "#F59E0B",
    altText: "教師回應小幫手：表單驗證失敗",
  },
};

const buildFlexMessage = (event: NotifyEvent) => {
  const meta = META[event.kind];
  const body: Array<Record<string, unknown>> = [];

  const pushRow = (label: string, value: string, color = "#111827") => {
    body.push({
      type: "box",
      layout: "vertical",
      spacing: "xs",
      margin: "md",
      contents: [
        {
          type: "text",
          text: label,
          size: "xs",
          color: "#6b7280",
          weight: "bold",
        },
        {
          type: "text",
          text: value || "（無）",
          size: "sm",
          color,
          wrap: true,
        },
      ],
    });
  };

  if (event.kind === "success") {
    const tags: string[] = [];
    if (event.mode === "refine") tags.push("🔁 Refine 修改");
    else tags.push("🆕 首次產生");
    if (event.hasImage) tags.push("🖼 截圖");
    if (event.hasAdvanced) tags.push("⚙️ 進階情境");
    pushRow("模式", tags.join(" · "));
    pushRow("情境", event.scenario);
    pushRow("家長訊息", truncate(event.parentMessage, 120));
    pushRow("回覆預覽", truncate(event.reply, 160), "#1f2937");
  } else if (event.kind === "ai_error") {
    pushRow("情境", event.scenario);
    pushRow("家長訊息", truncate(event.parentMessage, 120));
    pushRow("錯誤訊息", truncate(event.errorMessage, 200), "#dc2626");
  } else {
    pushRow("錯誤訊息", truncate(event.errorMessage, 200), "#f59e0b");
  }

  body.push({ type: "separator", margin: "lg" });
  body.push({
    type: "text",
    text: `🕒 ${formatTimestamp()}`,
    size: "xs",
    color: "#9ca3af",
    margin: "md",
  });

  return {
    type: "flex",
    altText: meta.altText,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: meta.headerColor,
        paddingAll: "md",
        contents: [
          {
            type: "text",
            text: meta.title,
            color: "#ffffff",
            weight: "bold",
            size: "md",
            wrap: true,
          },
          {
            type: "text",
            text: "教師回應訊息建議小幫手",
            color: "#ffffffcc",
            size: "xs",
            margin: "xs",
          },
        ],
      },
      body: { type: "box", layout: "vertical", spacing: "sm", contents: body },
    },
  };
};

/**
 * 推播 LINE 通知（fire-and-forget，永不 throw）
 *
 * @param event 通知事件
 * @param token Cloud Function secret 注入的 LINE_CHANNEL_ACCESS_TOKEN
 * @param userId Cloud Function secret 注入的 LINE_ADMIN_USER_ID
 */
export async function notifyLine(
  event: NotifyEvent,
  token: string | undefined,
  userId: string | undefined,
): Promise<void> {
  // skill 慣例：DISABLED 字串視為已停用，方便 prod 暫時關閉而不刪 secret
  if (
    !token ||
    !userId ||
    token === "DISABLED" ||
    userId === "DISABLED"
  ) {
    return;
  }

  try {
    const res = await fetch(LINE_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [buildFlexMessage(event)],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      logger.warn("[LINE Notify] push failed", {
        status: res.status,
        body: text.slice(0, 300),
        kind: event.kind,
      });
    }
  } catch (err) {
    logger.warn("[LINE Notify] push exception", {
      error: err instanceof Error ? err.message : String(err),
      kind: event.kind,
    });
  }
}
