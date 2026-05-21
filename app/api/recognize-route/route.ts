import { NextResponse } from "next/server";
import { createChatCompletion, hasAiConfig } from "@/lib/ai-client";

type RecognizeRequest = {
  input?: string;
};

type RecognitionResult = {
  goal: string;
  profile: string;
  constraints: string[];
  keywords: string[];
  prompt: string;
};

const SYSTEM_PROMPT = `You are Maopu's learning route requirement recognizer.
Read the user's messy learning description and extract a route planning brief.
Return JSON only:
{
  "goal": "one clear learning goal in Simplified Chinese",
  "profile": "current background in one short sentence",
  "constraints": ["time/budget/exam/project constraints"],
  "keywords": ["3-6 route keywords"],
  "prompt": "a concise route-generation prompt in Simplified Chinese"
}
Do not invent highly specific facts. If missing, use reasonable generic wording.`;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RecognizeRequest;
  const input = body.input?.trim() ?? "";

  if (!input) {
    return NextResponse.json(localRecognize("我想学习一个新方向"));
  }

  if (!hasAiConfig()) {
    return NextResponse.json(localRecognize(input));
  }

  try {
    const content = await createChatCompletion({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: input }
      ],
      temperature: 0.2,
      maxTokens: 360,
      responseFormat: "json_object",
      timeoutMs: 10000
    });

    return NextResponse.json(normalizeRecognition(JSON.parse(stripCodeFence(content)), input));
  } catch (error) {
    console.warn("Route recognition fallback:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(localRecognize(input));
  }
}

function stripCodeFence(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function normalizeRecognition(value: Partial<RecognitionResult>, input: string): RecognitionResult {
  const fallback = localRecognize(input);
  const constraints = Array.isArray(value.constraints) ? value.constraints.map(String).filter(Boolean).slice(0, 4) : fallback.constraints;
  const keywords = Array.isArray(value.keywords) ? value.keywords.map(String).filter(Boolean).slice(0, 6) : fallback.keywords;
  const goal = cleanText(value.goal) || fallback.goal;
  const profile = cleanText(value.profile) || fallback.profile;
  const prompt = cleanText(value.prompt) || buildPrompt(goal, profile, constraints, input);

  return { goal, profile, constraints, keywords, prompt };
}

function localRecognize(input: string): RecognitionResult {
  const goal = inferGoal(input);
  const profile = inferProfile(input);
  const constraints = inferConstraints(input);
  const keywords = inferKeywords(input, goal);

  return {
    goal,
    profile,
    constraints,
    keywords,
    prompt: buildPrompt(goal, profile, constraints, input)
  };
}

function inferGoal(input: string) {
  const patterns = [/想(?:成为|做|学会|学习|转行到)([^，。,.!！?？]{2,24})/, /目标是([^，。,.!！?？]{2,24})/];
  for (const pattern of patterns) {
    const match = input.match(pattern)?.[1]?.trim();
    if (match) return match.replace(/^一名?/, "");
  }

  if (/全栈|前端|后端|工程师|开发/.test(input)) return "成为能独立交付项目的软件工程师";
  if (/AI|人工智能|机器学习|大模型|深度学习/.test(input)) return "掌握 AI 应用开发";
  if (/考研|408|复试/.test(input)) return "系统准备计算机考研";
  return input.length <= 28 ? input : "围绕我的描述规划学习路线";
}

function inferProfile(input: string) {
  if (/零基础|没有基础|小白/.test(input)) return "当前基础较弱，需要从入门概念开始。";
  if (/会|学过|基础|做过|项目/.test(input)) return "已有部分基础，希望把知识整理成可执行路线。";
  return "当前基础未明确，需要先识别前置知识并逐步推进。";
}

function inferConstraints(input: string) {
  const constraints: string[] = [];
  const time = input.match(/(\d+\s*(?:天|周|个月|年))/)?.[1];
  if (time) constraints.push(`希望在 ${time} 内看到阶段成果`);
  if (/考试|考研|面试|求职|实习/.test(input)) constraints.push("路线需要服务考试、面试或求职结果");
  if (/项目|作品集|上线|demo/i.test(input)) constraints.push("路线需要包含可展示项目");
  if (!constraints.length) constraints.push("路线需要从目标倒推，兼顾概念、练习和项目");
  return constraints.slice(0, 4);
}

function inferKeywords(input: string, goal: string) {
  const candidates = ["前端", "后端", "数据库", "算法", "操作系统", "计算机网络", "AI", "项目", "部署", "面试", "考研"];
  const found = candidates.filter((item) => input.includes(item) || goal.includes(item));
  return (found.length ? found : ["基础", "核心概念", "项目练习", "路线规划"]).slice(0, 6);
}

function buildPrompt(goal: string, profile: string, constraints: string[], input: string) {
  return `请为「${goal}」设计一条专属知识路线。用户背景：${profile} 约束：${constraints.join("；")}。原始描述：${input}`;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.replace(/[#*_`]/g, "").trim() : "";
}
