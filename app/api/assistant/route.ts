import { NextResponse } from "next/server";
import { createChatCompletion, hasAiConfig } from "@/lib/ai-client";
import { KnowledgeNode, Route as MaopuRoute } from "@/lib/route-data";

type AssistantAction = "explain" | "resource" | "next" | "ask";

type AssistantRequest = {
  route?: MaopuRoute;
  currentNode?: KnowledgeNode | null;
  action?: AssistantAction;
  question?: string;
};

const SYSTEM_PROMPT = `You are Maopu's learning assistant.
Answer in Simplified Chinese only.
Return plain text only. No JSON. No markdown.
Keep the answer under 100 Chinese characters.
Use the current roadmap/node context.
For explain: state the core problem first.
For resource: recommend 2-4 resources and how to use them.
For next: name the next topic and why.
For ask: answer the user's question directly.
Only answer the requested action.`;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as AssistantRequest;
  const action = body.action ?? "next";
  const question = body.question?.trim();
  const route = body.route;
  const currentNode = body.currentNode ?? route?.nodes[0] ?? null;

  if (!hasAiConfig()) {
    return NextResponse.json({ message: fallbackMessage(action, route, currentNode, question) });
  }

  try {
    const context = buildAssistantContext(route, currentNode, question);
    const content = await createChatCompletion({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `本次动作：${actionLabel(action)}。请只完成这个动作。
${question ? `用户问题：${question}` : ""}
当前知识地图资料：
${context}`
        }
      ],
      temperature: 0.55,
      maxTokens: 180,
      timeoutMs: 8000
    });

    return NextResponse.json({ message: cleanAssistantMessage(content) });
  } catch {
    return NextResponse.json({ message: fallbackMessage(action, route, currentNode, question) });
  }
}

function buildAssistantContext(route: MaopuRoute | undefined, node: KnowledgeNode | null, question?: string) {
  const nextNode = nextLearningNode(route, node);
  return JSON.stringify({
    routeTitle: route?.title,
    routeSummary: route?.summary,
    currentNode: node
      ? {
          title: node.title,
          domain: node.domain,
          why: node.why,
          prerequisites: node.prerequisites.slice(0, 3),
          path: node.path.slice(0, 3),
          resources: node.resources.slice(0, 4)
        }
      : null,
    nextNode: nextNode
      ? {
          title: nextNode.title,
          domain: nextNode.domain,
          prerequisites: nextNode.prerequisites.slice(0, 3)
        }
      : null,
    nearbyNodes: route?.nodes.slice(0, 12).map((item) => `${item.title}(${item.status})`),
    question
  });
}

function actionLabel(action: AssistantAction) {
  if (action === "explain") return "解释当前概念";
  if (action === "resource") return "推荐当前节点资源";
  if (action === "ask") return "回答用户自由提问";
  return "建议下一步学什么";
}

function cleanAssistantMessage(content: string) {
  const text = content
    .replace(/[#*_`>]/g, "")
    .replace(/^\s*[-+]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 180 ? `${text.slice(0, 178)}...` : text;
}

function fallbackMessage(action: AssistantAction, route: MaopuRoute | undefined, node: KnowledgeNode | null, question?: string) {
  const target = node?.title ?? route?.title ?? "当前路线";

  if (action === "ask") {
    return question
      ? fallbackQuestionAnswer(question, target)
      : `你可以问我「${target}」的概念、资源或下一步学习建议。`;
  }

  if (action === "explain") {
    return node?.why ?? `${target}的核心价值，是帮你把学习目标拆成能理解、能练习、能验证的知识结构。`;
  }

  if (action === "resource") {
    const resources = node?.resources?.length ? node.resources : ["官方文档", "经典公开课", "小项目练习"];
    return `推荐先用这些资源：${resources.slice(0, 4).join("、")}。先快速建立全貌，再用一个小项目验证理解。`;
  }

  const nextNode = nextLearningNode(route, node);
  return nextNode
    ? `下一步建议学习「${nextNode.title}」。它会补上当前路线里的关键依赖，让后面的知识更容易连起来。`
    : `下一步先复盘「${target}」的前置知识，再做一个小项目确认自己真的会用。`;
}

function nextLearningNode(route: MaopuRoute | undefined, node: KnowledgeNode | null) {
  return route?.nodes.find((item) => item.status !== "learned" && item.id !== node?.id) ?? route?.nodes[0] ?? null;
}

function fallbackQuestionAnswer(question: string, target: string) {
  if (/先学|顺序|下一步|先做/.test(question)) {
    return `围绕「${target}」，建议先补前置知识，再做一个小练习验证理解；如果卡住，再回到路线里的上一个节点。`;
  }

  if (/资源|书|课程|视频|资料/.test(question)) {
    return `围绕「${target}」，先用官方文档或经典公开课建立全貌，再找一个小项目边做边查。`;
  }

  if (/为什么|概念|是什么|解释/.test(question)) {
    return `可以先把「${target}」理解成解决一个核心问题的工具：它为什么被发明、依赖什么、能做出什么。`;
  }

  return `围绕「${target}」，可以把这个问题拆成：核心概念、前置知识、一个可完成的小练习。AI 暂时没接上，但这条拆法能先推进。`;
}
