type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ChatCompletionOptions = {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json_object";
  timeoutMs?: number;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

export function hasAiConfig() {
  return Boolean(readEnv("AI_BASE_URL") && readEnv("AI_API_KEY"));
}

export async function createChatCompletion({
  messages,
  model,
  temperature = 0.4,
  maxTokens,
  responseFormat,
  timeoutMs = 8000
}: ChatCompletionOptions) {
  if (!hasAiConfig()) {
    throw new Error("AI config is missing");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const baseUrl = readEnv("AI_BASE_URL")?.replace(/\/+$/, "");
    const apiKey = readEnv("AI_API_KEY");
    const selectedModel = model || readEnv("AI_MODEL") || "deepseek-chat";
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        temperature,
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
        ...(responseFormat ? { response_format: { type: responseFormat } } : {})
      })
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`);
    }

    const payload = (await response.json()) as ChatCompletionResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI response has no content");
    }

    return content.trim();
  } finally {
    clearTimeout(timeout);
  }
}

function readEnv(name: string) {
  return process.env[name]?.replace(/^\uFEFF/, "").trim();
}
