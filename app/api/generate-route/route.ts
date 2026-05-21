import { NextResponse } from "next/server";
import { defaultRoute, routeForGoal, Route as MaopuRoute } from "@/lib/route-data";

type GenerateRequest = {
  goal?: string;
};

const SYSTEM_PROMPT = `你是猫扑的知识地图生成器。请把用户目标拆成知识地图 JSON。
只返回 JSON，不要 Markdown。
必须遵循这个结构：
{
  "title": string,
  "description": string,
  "summary": string,
  "domains": {
    "math": string,
    "system": string,
    "programming": string,
    "frontend": string,
    "backend": string,
    "engineering": string,
    "ai": string
  },
  "nodes": [
    {
      "id": string,
      "title": string,
      "domain": "math" | "system" | "programming" | "frontend" | "backend" | "engineering" | "ai",
      "core": boolean,
      "status": "learned" | "learning" | "unlearned",
      "position": { "x": number, "y": number },
      "why": string,
      "problems": string[],
      "prerequisites": string[],
      "path": string[],
      "projects": string[],
      "resources": string[]
    }
  ],
  "edges": [
    {
      "id": string,
      "source": string,
      "target": string,
      "kind": "dependency" | "related"
    }
  ]
}
要求：12 到 18 个节点；核心节点更大但只通过 core 字段表达；position 用横向科技树布局；why 必须从第一性原理解释这门课为什么被发明。`;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as GenerateRequest;
  const goal = body.goal?.trim() || "我想成为一名全栈工程师";

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(routeForGoal(goal));
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `学习目标：${goal}` }
        ],
        text: { format: { type: "json_object" } }
      })
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(routeForGoal(goal));
    }

    const payload = await response.json();
    const text = extractResponseText(payload);
    const parsed = JSON.parse(text) as MaopuRoute;
    return NextResponse.json(normalizeRoute(parsed, goal));
  } catch {
    return NextResponse.json(routeForGoal(goal));
  }
}

function extractResponseText(payload: unknown): string {
  const maybe = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  if (maybe.output_text) return maybe.output_text;

  const text = maybe.output?.flatMap((item) => item.content ?? []).find((item) => item.text)?.text;
  if (text) return text;

  throw new Error("No response text");
}

function normalizeRoute(route: MaopuRoute, goal: string): MaopuRoute {
  const fallback = routeForGoal(goal);
  const nodes = Array.isArray(route.nodes) && route.nodes.length > 0 ? route.nodes : fallback.nodes;
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = Array.isArray(route.edges)
    ? route.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    : fallback.edges;

  return {
    ...defaultRoute,
    ...route,
    title: route.title || fallback.title,
    description: route.description || fallback.description,
    summary: route.summary || fallback.summary,
    domains: { ...defaultRoute.domains, ...(route.domains ?? {}) },
    nodes,
    edges
  };
}
