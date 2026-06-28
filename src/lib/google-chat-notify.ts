"use server";

type ChatStatus = "started" | "success" | "failure";

interface ChatNotifyInput {
  requestId: string;
  status: ChatStatus;
  title: string;
  scenario?: string;
  progress: string;
  message?: string;
  error?: string;
  durationMs?: number;
}

const STATUS_LABELS: Record<ChatStatus, string> = {
  started: "處理中",
  success: "成功",
  failure: "失敗",
};

const STATUS_ICONS: Record<ChatStatus, string> = {
  started: "⏳",
  success: "✅",
  failure: "⚠️",
};

function truncate(value: string | undefined, maxLength = 240): string {
  if (!value) return "";
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1)}…`
    : normalized;
}

function formatDuration(durationMs: number | undefined): string {
  if (typeof durationMs !== "number") return "尚未完成";
  if (durationMs < 1000) return `${durationMs} ms`;
  return `${(durationMs / 1000).toFixed(1)} 秒`;
}

function buildChatPayload(input: ChatNotifyInput) {
  const subtitle = `${STATUS_ICONS[input.status]} 狀態：${STATUS_LABELS[input.status]}`;
  const rows = [
    { label: "進度", text: input.progress },
    { label: "情境", text: input.scenario || "未提供" },
    { label: "耗時", text: formatDuration(input.durationMs) },
    { label: "追蹤 ID", text: input.requestId },
  ];

  if (input.message) {
    rows.push({ label: "摘要", text: truncate(input.message) });
  }

  if (input.error) {
    rows.push({ label: "錯誤", text: truncate(input.error, 360) });
  }

  return {
    text: `${subtitle}｜${input.title}｜${input.progress}`,
    cardsV2: [
      {
        cardId: `service-${input.status}-${input.requestId}`,
        card: {
          header: {
            title: input.title,
            subtitle,
          },
          sections: [
            {
              widgets: rows.map((row) => ({
                decoratedText: {
                  topLabel: row.label,
                  text: row.text,
                  wrapText: true,
                },
              })),
            },
          ],
        },
      },
    ],
  };
}

export async function notifyGoogleChat(input: ChatNotifyInput): Promise<void> {
  const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    console.warn("[GoogleChatNotify] GOOGLE_CHAT_WEBHOOK_URL is not configured.");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(buildChatPayload(input)),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[GoogleChatNotify] Failed to send notification:", response.status, body);
    }
  } catch (error) {
    console.error("[GoogleChatNotify] Notification request failed:", error);
  }
}
