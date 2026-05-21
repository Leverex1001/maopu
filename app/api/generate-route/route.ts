import { NextResponse } from "next/server";
import { createChatCompletion, hasAiConfig } from "@/lib/ai-client";
import { defaultRoute, Domain, routeForGoal, Route as MaopuRoute } from "@/lib/route-data";

type GenerateRequest = {
  goal?: string;
};

type AiRouteOutline = {
  title?: string;
  description?: string;
  summary?: string;
  courses?: string[];
};

const SYSTEM_PROMPT = `You are Maopu's roadmap outline generator.
Return exactly 12 concise course or skill names in Simplified Chinese.
Separate names with commas.
No explanation. No markdown.`;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as GenerateRequest;
  const goal = body.goal?.trim() || "我想成为一名全栈工程师";

  if (!hasAiConfig()) {
    return NextResponse.json(routeForGoal(goal));
  }

  try {
    const text = await createChatCompletion({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Learning goal: ${goal}` }
      ],
      temperature: 0.25,
      maxTokens: 240,
      timeoutMs: 45000
    });
    const outline = {
      title: `${goal.replace(/^我想|^想/, "").replace(/^成为一名?/, "") || "学习"}路线`,
      description: `根据「${goal}」由 AI 生成的知识地图，展示关键知识点和学习依赖。`,
      summary: "AI 已按目标生成 12 个核心学习节点。",
      courses: parseCourseList(text)
    };
    return NextResponse.json(routeFromOutline(outline, goal));
  } catch {
    return NextResponse.json(routeForGoal(goal));
  }
}

function parseCourseList(text: string) {
  return text
    .trim()
    .replace(/^```(?:text)?/i, "")
    .replace(/```$/i, "")
    .split(/[,，\n、]/)
    .map((item) => item.replace(/^\d+[.)、]\s*/, "").trim())
    .filter(Boolean);
}

function routeFromOutline(outline: AiRouteOutline, goal: string): MaopuRoute {
  const fallback = routeForGoal(goal);
  const courses = normalizeTextList(outline.courses).slice(0, 12);
  if (courses.length < 6) {
    throw new Error("AI outline has too few courses");
  }

  const nodes: MaopuRoute["nodes"] = courses.map((title, index) => {
    const template = fallback.nodes[index % fallback.nodes.length];
    const domain = inferDomain(title, index);
    const previousTitle = index === 0 ? "基础计算机使用" : courses[Math.max(0, index - 1)];

    return {
      ...template,
      id: slugifyCourse(title, index),
      title,
      domain,
      core: isCoreCourse(title, index),
      status: index < 2 ? "learned" : index < 5 ? "learning" : "unlearned",
      position: { x: 90 + Math.floor(index / 3) * 300, y: 70 + (index % 3) * 230 },
      why: reasonForCourse(title, domain, goal),
      problems: problemsForCourse(title, domain),
      prerequisites: index === 0 ? ["基础计算机使用"] : [previousTitle, ...prerequisitesForDomain(domain)].slice(0, 3),
      path: pathForCourse(title, domain),
      projects: projectsForCourse(title, domain),
      resources: resourcesForCourse(title, domain)
    };
  });

  const edges: MaopuRoute["edges"] = nodes.slice(1).map((node, index) => ({
    id: `e-${index + 1}`,
    source: nodes[index].id,
    target: node.id,
    kind: "dependency"
  }));

  return normalizeRoute(
    {
      ...fallback,
      title: outline.title || fallback.title,
      description: outline.description || fallback.description,
      summary: outline.summary || `根据「${goal}」生成的 AI 知识地图，共 ${nodes.length} 个节点。`,
      nodes,
      edges
    },
    goal
  );
}

function normalizeRoute(route: MaopuRoute, goal: string): MaopuRoute {
  const fallback = routeForGoal(goal);
  const nodes =
    Array.isArray(route.nodes) && route.nodes.length > 0
      ? route.nodes.map((node, index) => ({
          ...fallback.nodes[index % fallback.nodes.length],
          ...node,
          id: String(node.id || `node-${index + 1}`),
          title: String(node.title || fallback.nodes[index % fallback.nodes.length].title),
          domain: isDomain(node.domain) ? node.domain : fallback.nodes[index % fallback.nodes.length].domain,
          core: typeof node.core === "boolean" ? node.core : fallback.nodes[index % fallback.nodes.length].core,
          status: isLearningStatus(node.status) ? node.status : "unlearned",
          why: String(node.why || fallback.nodes[index % fallback.nodes.length].why),
          position: {
            x: Number.isFinite(node.position?.x) ? node.position.x : 120 + index * 260,
            y: Number.isFinite(node.position?.y) ? node.position.y : 80 + (index % 3) * 220
          },
          problems: normalizeTextList(node.problems),
          prerequisites: normalizeTextList(node.prerequisites),
          path: normalizeTextList(node.path),
          projects: normalizeTextList(node.projects),
          resources: normalizeTextList(node.resources)
        }))
      : fallback.nodes;
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

function normalizeTextList(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function isDomain(value: unknown) {
  return typeof value === "string" && value in defaultRoute.domains;
}

function isLearningStatus(value: unknown) {
  return value === "learned" || value === "learning" || value === "unlearned";
}

function inferDomain(title: string, index: number): Domain {
  const lower = title.toLowerCase();
  if (/数学|概率|统计|线性|离散|math|statistics/.test(lower)) return "math";
  if (/操作系统|网络|linux|系统|计算机组成|os|network/.test(lower)) return "system";
  if (/html|css|javascript|typescript|react|vue|前端|界面|ui/.test(lower)) return "frontend";
  if (/数据库|sql|后端|api|node|服务|缓存|backend|database/.test(lower)) return "backend";
  if (/docker|devops|部署|测试|工程|git|ci|cd/.test(lower)) return "engineering";
  if (/ai|机器学习|深度学习|模型|llm|prompt/.test(lower)) return "ai";
  return index % 5 === 0 ? "programming" : index % 5 === 1 ? "frontend" : index % 5 === 2 ? "backend" : index % 5 === 3 ? "system" : "engineering";
}

function isCoreCourse(title: string, index: number) {
  return index === 1 || index === 2 || index === 5 || index === 8 || /javascript|typescript|react|数据库|后端|算法|系统|模型|api/i.test(title);
}

function reasonForCourse(title: string, domain: Domain, goal: string) {
  const reasons: Record<Domain, string> = {
    math: "把模糊问题变成可推理的结构",
    system: "理解程序运行时依赖的机器、进程、内存和通信秩序",
    programming: "把想法表达成可执行、可复用、可维护的代码",
    frontend: "把数据和业务能力变成用户能理解和操作的界面",
    backend: "把用户请求转成可靠的数据、权限和业务流程",
    engineering: "让软件能被协作开发、部署、观测和持续迭代",
    ai: "把数据、模型和产品问题连接成可使用的智能能力"
  };

  return `${title}存在的根本原因，是${reasons[domain]}，从而服务「${goal}」这个目标。`;
}

function problemsForCourse(title: string, domain: Domain) {
  const problems: Record<Domain, string[]> = {
    math: ["如何抽象问题结构？", "如何判断推理是否可靠？", "如何为后续算法打基础？"],
    system: ["程序为什么能稳定运行？", "资源如何被分配和隔离？", "不同机器如何通信？"],
    programming: ["问题如何拆成数据和步骤？", "代码如何保持可读可改？", "错误如何被定位？"],
    frontend: ["用户如何理解系统状态？", "界面如何响应操作？", "复杂页面如何拆成组件？"],
    backend: ["请求如何变成业务动作？", "数据如何持久保存？", "权限和错误如何处理？"],
    engineering: ["多人如何协作交付？", "环境差异如何消除？", "上线后如何定位问题？"],
    ai: ["模型如何接入产品？", "提示词如何稳定输出？", "结果如何评估和兜底？"]
  };

  return [`${title}的核心边界是什么？`, ...problems[domain].slice(0, 2)];
}

function prerequisitesForDomain(domain: Domain) {
  const prerequisites: Record<Domain, string[]> = {
    math: ["基础逻辑"],
    system: ["C/基础编程", "数据结构"],
    programming: ["编程基础"],
    frontend: ["HTML/CSS", "JavaScript"],
    backend: ["网络基础", "数据库基础"],
    engineering: ["Linux 基础", "Git"],
    ai: ["Python 基础", "概率统计"]
  };

  return prerequisites[domain];
}

function pathForCourse(title: string, domain: Domain) {
  const paths: Record<Domain, string[]> = {
    math: ["核心定义", "典型证明/推理", "用代码建模"],
    system: ["核心抽象", "关键机制", "动手观察运行行为"],
    programming: ["语法和模型", "数据结构/模块", "小项目重构"],
    frontend: ["页面结构", "状态与交互", "组件化实现"],
    backend: ["API 设计", "数据模型", "认证和错误处理"],
    engineering: ["本地流程", "自动化脚本", "部署与观测"],
    ai: ["任务定义", "提示和调用", "评估与 fallback"]
  };

  return [`建立${title}全貌`, ...paths[domain].slice(0, 2)];
}

function projectsForCourse(title: string, domain: Domain) {
  const projects: Record<Domain, string[]> = {
    math: ["课程依赖图建模", "小型推理练习集"],
    system: ["命令行观察实验", "简化服务通信 demo"],
    programming: ["工具函数库", "路线数据处理脚本"],
    frontend: ["知识节点组件", "学习路线交互页"],
    backend: ["路线生成 API", "学习记录 CRUD"],
    engineering: ["一键部署脚本", "日志和健康检查面板"],
    ai: ["AI 助手 prompt 调试台", "模型输出评估表"]
  };

  return [`${title}小练习`, ...projects[domain].slice(0, 2)];
}

function resourcesForCourse(title: string, domain: Domain) {
  const resources: Record<Domain, string[]> = {
    math: ["MIT Mathematics for Computer Science", "可汗学院相关章节"],
    system: ["CSAPP / OSTEP", "Computer Networking: A Top-Down Approach"],
    programming: ["MDN / 官方文档", "Hello 算法"],
    frontend: ["MDN Web Docs", "React / Next.js Docs"],
    backend: ["Node.js / FastAPI Docs", "SQLBolt"],
    engineering: ["Git 官方文档", "Docker Docs"],
    ai: ["OpenAI Docs", "DeepSeek / 模型平台文档"]
  };

  return [`${title}关键词检索`, ...resources[domain].slice(0, 2)];
}

function slugifyCourse(title: string, index: number) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "node"}-${index + 1}`;
}
