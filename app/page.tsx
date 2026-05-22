"use client";

import "@xyflow/react/dist/style.css";

import { AnimatePresence, motion } from "framer-motion";
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import {
  Background,
  Controls,
  Edge,
  Handle,
  MarkerType,
  MiniMap,
  Node,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow
} from "@xyflow/react";
import {
  AlertTriangle,
  BookOpen,
  Boxes,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Code2,
  Compass,
  Copy,
  Download,
  FileText,
  GitFork,
  GraduationCap,
  Heart,
  Home,
  KeyRound,
  Layers3,
  Library,
  LockKeyhole,
  Mail,
  Map as MapIcon,
  MessageCircle,
  PanelRightOpen,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  X
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  aiEngineerRoute,
  csdiyRoute,
  defaultRoute,
  Domain,
  domainStyles,
  KnowledgeEdge,
  KnowledgeNode,
  LearningStatus,
  routeForGoal,
  Route as MaopuRoute
} from "@/lib/route-data";
import { getSupabaseBrowserClient, hasSupabaseBrowserConfig } from "@/lib/supabase-client";

type View = "landing" | "map" | "upload" | "community" | "universe";

type Toast = {
  id: number;
  message: string;
};

type AssistantAction = "next" | "explain" | "resource" | "ask";
type MascotVariant = "planner" | "coder" | "idea" | "thinking" | "sleepy" | "happy";
type AuthMode = "login" | "register";

type RecognitionResult = {
  goal: string;
  profile: string;
  constraints: string[];
  keywords: string[];
  prompt: string;
};

type CommunityRouteCard = {
  title: string;
  author: string;
  rating: string;
  learners: string;
  categories: string[];
  prompt: string;
  builtinRoute?: MaopuRoute;
  source?: "builtin" | "local";
  visibility?: "private" | "public" | "unlisted";
};

type MapSidebarItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
};

type RouteHealthItem = {
  id: string;
  label: string;
  detail: string;
  tone: "ok" | "warn" | "danger";
};

type RouteHealth = {
  score: number;
  summary: string;
  nextAction: string;
  items: RouteHealthItem[];
};

type ShareRecord = {
  id: string;
  title: string;
  sharedAt: string;
};

const STORAGE_KEY = "maopu.savedRoutes.v1";
const FAVORITES_KEY = "maopu.favoriteCommunityRoutes.v1";
const MASCOT_STYLE_KEY = "maopu.mascotStyle.v1";
const PUBLISHED_ROUTES_KEY = "maopu.publishedRoutes.v1";
const SHARE_HISTORY_KEY = "maopu.shareHistory.v1";

const routeCards: CommunityRouteCard[] = [
  {
    title: "CS 基础自学路线（CSDIY 精选）",
    author: "csdiy.wiki · PKUFlyingPig",
    rating: "4.9",
    learners: "32.1k",
    categories: ["热门", "精选", "CS 基础"],
    prompt: "",
    builtinRoute: csdiyRoute
  },
  {
    title: "AI 工程师路线",
    author: "猫扑精选",
    rating: "4.9",
    learners: "18.6k",
    categories: ["热门", "精选", "AI", "就业"],
    prompt: "",
    builtinRoute: aiEngineerRoute
  },
  {
    title: "全栈工程师路线",
    author: "猫扑精选",
    rating: "4.8",
    learners: "21.3k",
    categories: ["热门", "精选", "就业"],
    prompt: "",
    builtinRoute: defaultRoute
  },
  {
    title: "计算机考研 408 路线",
    author: "408 Study Plan",
    rating: "4.7",
    learners: "15.1k",
    categories: ["热门", "考研"],
    prompt: "为计算机考研 408 规划系统复习路线，覆盖数据结构、组成原理、操作系统、计算机网络，每个模块注明第一性原理和核心考点，附推荐教材和练习资源"
  },
  {
    title: "前端就业项目路线",
    author: "Frontend Career",
    rating: "4.6",
    learners: "6.9k",
    categories: ["最新", "就业"],
    prompt: "为前端就业准备规划路线，覆盖 HTML CSS JavaScript TypeScript React Next.js 工程化、项目作品和面试复盘，每个节点说明它解决什么问题"
  },
  {
    title: "独立游戏开发路线",
    author: "Indie Game Dev",
    rating: "4.6",
    learners: "5.2k",
    categories: ["最新", "游戏开发"],
    prompt: "为独立游戏开发者规划路线，覆盖游戏设计原理、Unity/Godot 引擎、图形学基础、物理模拟、关卡设计、发布平台和作品集建设"
  }
];

const domainOptions = Object.entries(domainStyles).map(([value, style]) => ({
  value: value as Domain,
  label: style.label
}));

const statusOptions: Array<{ value: LearningStatus; label: string }> = [
  { value: "learned", label: "已学习" },
  { value: "learning", label: "学习中" },
  { value: "unlearned", label: "未学习" }
];

const mascotStyles: Array<{ value: MascotVariant; label: string; description: string; avatar: string }> = [
  { value: "planner", label: "精神", description: "挥手上线，适合开始规划", avatar: "/maopu-images/mascot-avatar-planner.png" },
  { value: "coder", label: "学习", description: "伏案学习，适合拆解路线", avatar: "/maopu-images/mascot-avatar-coder.png" },
  { value: "idea", label: "灵感", description: "想到办法，适合生成方案", avatar: "/maopu-images/mascot-avatar-idea.png" },
  { value: "thinking", label: "思考", description: "认真判断，适合分析取舍", avatar: "/maopu-images/mascot-avatar-thinking.png" },
  { value: "sleepy", label: "困困", description: "打哈欠，适合慢慢陪学", avatar: "/maopu-images/mascot-avatar-sleepy.png" },
  { value: "happy", label: "开心", description: "挥手鼓励，适合完成节点", avatar: "/maopu-images/mascot-avatar-happy.png" }
];

const SUPABASE_SCHEMA_SQL = `create table public.routes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  summary text not null default '',
  route jsonb not null,
  visibility text not null default 'private' check (visibility in ('private', 'public', 'unlisted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.route_favorites (
  user_id uuid references auth.users(id) on delete cascade,
  route_id uuid references public.routes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, route_id)
);

create table public.route_progress (
  user_id uuid references auth.users(id) on delete cascade,
  route_id uuid references public.routes(id) on delete cascade,
  node_id text not null,
  status text not null check (status in ('learned', 'learning', 'unlearned')),
  updated_at timestamptz not null default now(),
  primary key (user_id, route_id, node_id)
);

alter table public.routes enable row level security;
alter table public.route_favorites enable row level security;
alter table public.route_progress enable row level security;

drop policy if exists "Users can read own and visible routes" on public.routes;
create policy "Users can read own and visible routes"
on public.routes for select
using (owner_id = auth.uid() or visibility in ('public', 'unlisted'));

drop policy if exists "Users can insert own routes" on public.routes;
create policy "Users can insert own routes"
on public.routes for insert
with check (owner_id = auth.uid());

drop policy if exists "Users can update own routes" on public.routes;
create policy "Users can update own routes"
on public.routes for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Users can delete own routes" on public.routes;
create policy "Users can delete own routes"
on public.routes for delete
using (owner_id = auth.uid());

drop policy if exists "Users can manage own favorites" on public.route_favorites;
create policy "Users can manage own favorites"
on public.route_favorites for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can manage own progress" on public.route_progress;
create policy "Users can manage own progress"
on public.route_progress for all
using (user_id = auth.uid())
with check (user_id = auth.uid());`;

function createBlankRoute(title = "我的自定义路线"): MaopuRoute {
  return {
    title,
    description: "先描述目标、基础和约束，再由猫扑识别并规划路线；也可以从空白地图手动添加节点。",
    summary: "这是一条空白路线，等待你添加目标、知识点和依赖关系。",
    domains: defaultRoute.domains,
    nodes: [],
    edges: []
  };
}

function routeStorageId(route: MaopuRoute) {
  return `${route.title}-${route.nodes.length}-${route.edges.length}`;
}

function calculateProgress(route: MaopuRoute) {
  if (!route.nodes.length) return 0;
  const learned = route.nodes.filter((node) => node.status === "learned").length;
  const learning = route.nodes.filter((node) => node.status === "learning").length;
  return Math.round(((learned + learning * 0.5) / route.nodes.length) * 100);
}

function analyzeRouteHealth(route: MaopuRoute): RouteHealth {
  const nodeIds = new Set(route.nodes.map((node) => node.id));
  const validEdges = route.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
  const brokenEdges = route.edges.length - validEdges.length;
  const titleCounts = new Map<string, number>();
  route.nodes.forEach((node) => {
    const key = node.title.trim().toLowerCase();
    if (key) titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1);
  });
  const duplicateTitles = [...titleCounts.values()].filter((count) => count > 1).length;
  const connectedNodeIds = new Set(validEdges.flatMap((edge) => [edge.source, edge.target]));
  const isolatedNodes = route.nodes.length > 1 ? route.nodes.filter((node) => !connectedNodeIds.has(node.id)).length : 0;
  const missingResources = route.nodes.filter((node) => node.resources.length === 0).length;
  const missingProjects = route.nodes.filter((node) => node.projects.length === 0).length;
  const coreCount = route.nodes.filter((node) => node.core).length;
  const hasEnoughEdges = route.nodes.length <= 1 || validEdges.length >= route.nodes.length - 1;

  let score = 100;
  if (route.nodes.length === 0) score -= 45;
  if (!hasEnoughEdges) score -= 18;
  if (coreCount === 0 && route.nodes.length > 0) score -= 10;
  score -= Math.min(24, brokenEdges * 12);
  score -= Math.min(20, duplicateTitles * 10);
  score -= Math.min(24, isolatedNodes * 6);
  score -= Math.min(16, missingResources * 3);
  score -= Math.min(12, missingProjects * 2);
  score = Math.max(0, Math.min(100, score));

  const issues: RouteHealthItem[] = [];
  if (route.nodes.length === 0) {
    issues.push({ id: "empty", label: "还没有节点", detail: "先添加第一个知识点或回到首页生成路线。", tone: "danger" });
  }
  if (brokenEdges > 0) {
    issues.push({ id: "broken-edges", label: `${brokenEdges} 条依赖失效`, detail: "有边指向了不存在的节点，导入或删除后需要清理。", tone: "danger" });
  }
  if (duplicateTitles > 0) {
    issues.push({ id: "duplicates", label: `${duplicateTitles} 组重复节点`, detail: "合并同名知识点，避免学习路线出现绕路。", tone: "warn" });
  }
  if (isolatedNodes > 0) {
    issues.push({ id: "isolated", label: `${isolatedNodes} 个孤立节点`, detail: "给它们补上前置或后续依赖，地图会更可执行。", tone: "warn" });
  }
  if (!hasEnoughEdges && route.nodes.length > 1) {
    issues.push({ id: "edge-coverage", label: "依赖关系偏少", detail: "至少补齐主线顺序，用户才知道先学什么。", tone: "warn" });
  }
  if (coreCount === 0 && route.nodes.length > 0) {
    issues.push({ id: "core", label: "缺少核心节点", detail: "标记 2-4 个核心知识点，帮助用户抓主线。", tone: "warn" });
  }
  if (missingResources > 0) {
    issues.push({ id: "resources", label: `${missingResources} 个节点缺资源`, detail: "给关键节点补官方文档、课程或练习链接。", tone: "warn" });
  }
  if (missingProjects > 0) {
    issues.push({ id: "projects", label: `${missingProjects} 个节点缺项目`, detail: "每段学习都需要一个能验证理解的小作品。", tone: "warn" });
  }

  const healthyItems: RouteHealthItem[] = [
    { id: "nodes", label: `${route.nodes.length} 个知识节点`, detail: route.nodes.length ? "路线已有可学习的结构。" : "等待生成或手动添加。", tone: route.nodes.length ? "ok" : "warn" },
    { id: "valid-edges", label: `${validEdges.length} 条有效依赖`, detail: hasEnoughEdges ? "主线依赖覆盖较完整。" : "依赖数量还不够支撑路线顺序。", tone: hasEnoughEdges ? "ok" : "warn" },
    { id: "core-count", label: `${coreCount} 个核心节点`, detail: coreCount ? "已经能看出路线重点。" : "还需要标记核心知识点。", tone: coreCount ? "ok" : "warn" }
  ];

  const summary = score >= 85 ? "结构很稳，可以直接学习或分享。" : score >= 65 ? "路线可用，但还值得补几处结构。" : "路线还比较松，需要先整理主线。";

  return {
    score,
    summary,
    nextAction: issues[0]?.detail ?? "可以继续点亮节点，或导出 Markdown 做学习计划。",
    items: [...issues, ...healthyItems].slice(0, 4)
  };
}

function safeSavedRoutes(): MaopuRoute[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as MaopuRoute[]) : [];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function safePublishedRoutes(): MaopuRoute[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(PUBLISHED_ROUTES_KEY);
    return saved ? (JSON.parse(saved) as MaopuRoute[]) : [];
  } catch {
    window.localStorage.removeItem(PUBLISHED_ROUTES_KEY);
    return [];
  }
}

function safeShareHistory(): ShareRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(SHARE_HISTORY_KEY);
    return saved ? (JSON.parse(saved) as ShareRecord[]) : [];
  } catch {
    window.localStorage.removeItem(SHARE_HISTORY_KEY);
    return [];
  }
}

function encodeRouteForShare(route: MaopuRoute) {
  return compressToEncodedURIComponent(JSON.stringify(route));
}

function decodeSharedRoute(hash: string): MaopuRoute | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const payload = params.get("route");
  if (!payload) return null;
  try {
    const text = decompressFromEncodedURIComponent(payload);
    if (!text) return null;
    return normalizeImportedRoute(JSON.parse(text));
  } catch {
    return null;
  }
}

function normalizeImportedRoute(value: unknown): MaopuRoute | null {
  if (!value || typeof value !== "object") return null;

  const route = value as Partial<MaopuRoute>;
  if (!route.title || !Array.isArray(route.nodes) || !Array.isArray(route.edges)) return null;

  const rawNodes = route.nodes
    .map((node, index) => normalizeImportedNode(node, index))
    .filter((node): node is KnowledgeNode => Boolean(node));
  if (!rawNodes.length) return null;

  const idMap = new Map<string, string>();
  const seenIds = new Set<string>();
  const nodes = rawNodes.map((node, index) => {
    const baseId = node.id || `imported-node-${index + 1}`;
    const uniqueId = seenIds.has(baseId) ? `${baseId}-${index + 1}` : baseId;
    seenIds.add(uniqueId);
    idMap.set(baseId, uniqueId);
    return { ...node, id: uniqueId };
  });
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = route.edges
    .map((edge, index) => normalizeImportedEdge(edge, index))
    .map((edge) => (edge ? { ...edge, source: idMap.get(edge.source) ?? edge.source, target: idMap.get(edge.target) ?? edge.target } : null))
    .filter((edge): edge is KnowledgeEdge => Boolean(edge && nodeIds.has(edge.source) && nodeIds.has(edge.target)));

  return {
    ...defaultRoute,
    title: String(route.title).trim() || "导入路线",
    description: String(route.description || "从外部 JSON 导入的学习路线。"),
    summary: String(route.summary || `已导入 ${nodes.length} 个知识节点。`),
    domains: { ...defaultRoute.domains, ...(route.domains ?? {}) },
    nodes,
    edges
  };
}

function normalizeImportedRoutePack(value: unknown): MaopuRoute[] {
  const rawRoutes =
    Array.isArray(value)
      ? value
      : value && typeof value === "object" && Array.isArray((value as { routes?: unknown[] }).routes)
        ? (value as { routes: unknown[] }).routes
        : [];

  const seen = new Set<string>();
  return rawRoutes
    .map((item) => normalizeImportedRoute(item))
    .filter((route): route is MaopuRoute => Boolean(route))
    .filter((route) => {
      const id = routeStorageId(route);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
}

function normalizeImportedNode(value: unknown, index: number): KnowledgeNode | null {
  if (!value || typeof value !== "object") return null;

  const node = value as Partial<KnowledgeNode>;
  const template = defaultRoute.nodes[index % defaultRoute.nodes.length];
  const title = String(node.title || template.title).trim();
  if (!title) return null;

  return {
    ...template,
    id: String(node.id || `imported-node-${index + 1}`).trim() || `imported-node-${index + 1}`,
    title,
    domain: isDomainValue(node.domain) ? node.domain : template.domain,
    core: typeof node.core === "boolean" ? node.core : template.core,
    status: isLearningStatusValue(node.status) ? node.status : "unlearned",
    position: {
      x: Number.isFinite(node.position?.x) ? Number(node.position?.x) : 120 + Math.floor(index / 3) * 300,
      y: Number.isFinite(node.position?.y) ? Number(node.position?.y) : 80 + (index % 3) * 220
    },
    why: String(node.why || template.why),
    problems: normalizeStringList(node.problems, template.problems),
    prerequisites: normalizeStringList(node.prerequisites, template.prerequisites),
    path: normalizeStringList(node.path, template.path),
    projects: normalizeStringList(node.projects, template.projects),
    resources: normalizeStringList(node.resources, template.resources)
  };
}

function normalizeImportedEdge(value: unknown, index: number): KnowledgeEdge | null {
  if (!value || typeof value !== "object") return null;

  const edge = value as Partial<KnowledgeEdge>;
  if (!edge.source || !edge.target) return null;

  return {
    id: String(edge.id || `imported-edge-${index + 1}`),
    source: String(edge.source),
    target: String(edge.target),
    kind: edge.kind === "related" ? "related" : "dependency"
  };
}

function normalizeStringList(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : fallback;
}

function isDomainValue(value: unknown): value is Domain {
  return typeof value === "string" && value in defaultRoute.domains;
}

function isLearningStatusValue(value: unknown): value is LearningStatus {
  return value === "learned" || value === "learning" || value === "unlearned";
}

function downloadText(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function readApiError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string; message?: string };
    return payload.message || payload.error || fallback;
  } catch {
    return fallback;
  }
}

function routeToMarkdown(route: MaopuRoute) {
  const nodeSections = route.nodes
    .map(
      (node) => `## ${node.title}

- 领域：${domainStyles[node.domain].label}
- 状态：${statusOptions.find((status) => status.value === node.status)?.label ?? node.status}
- 核心节点：${node.core ? "是" : "否"}

### 为什么会有这门课？
${node.why}

### 它解决什么问题？
${node.problems.map((item) => `- ${item}`).join("\n")}

### 前置知识
${node.prerequisites.map((item) => `- ${item}`).join("\n")}

### 推荐学习路径
${node.path.map((item) => `- ${item}`).join("\n")}

### 推荐项目
${node.projects.map((item) => `- ${item}`).join("\n")}

### 推荐资源
${node.resources.map((item) => `- ${item}`).join("\n")}`
    )
    .join("\n\n");

  return `# ${route.title}

${route.description}

${route.summary}

${nodeSections}
`;
}

function routeToSvg(route: MaopuRoute) {
  const minX = Math.min(...route.nodes.map((node) => node.position.x)) - 80;
  const minY = Math.min(...route.nodes.map((node) => node.position.y)) - 80;
  const maxX = Math.max(...route.nodes.map((node) => node.position.x)) + 320;
  const maxY = Math.max(...route.nodes.map((node) => node.position.y)) + 180;
  const width = maxX - minX;
  const height = maxY - minY;
  const escape = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const nodeById = new Map(route.nodes.map((node) => [node.id, node]));

  const edges = route.edges
    .map((edge) => {
      const source = nodeById.get(edge.source);
      const target = nodeById.get(edge.target);
      if (!source || !target) return "";
      const sx = source.position.x - minX + (source.core ? 230 : 170);
      const sy = source.position.y - minY + 38;
      const tx = target.position.x - minX;
      const ty = target.position.y - minY + 38;
      const color = domainStyles[source.domain].border;
      return `<path d="M ${sx} ${sy} C ${sx + 80} ${sy}, ${tx - 80} ${ty}, ${tx} ${ty}" fill="none" stroke="${color}" stroke-width="${edge.kind === "dependency" ? 3 : 2}" stroke-dasharray="${edge.kind === "related" ? "8 8" : "0"}"/>`;
    })
    .join("\n");

  const nodes = route.nodes
    .map((node) => {
      const style = domainStyles[node.domain];
      const x = node.position.x - minX;
      const y = node.position.y - minY;
      const w = node.core ? 230 : 170;
      const h = node.core ? 88 : 76;
      const status = statusOptions.find((item) => item.value === node.status)?.label ?? node.status;
      return `<g>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${node.status === "unlearned" ? "#ffffff" : style.bg}" stroke="${style.border}" stroke-width="2"/>
  <text x="${x + 18}" y="${y + 34}" font-size="${node.core ? 22 : 18}" font-weight="800" fill="${style.color}" font-family="Arial, Microsoft YaHei">${escape(node.title)}</text>
  <text x="${x + 18}" y="${y + 62}" font-size="13" font-weight="700" fill="#666b87" font-family="Arial, Microsoft YaHei">${escape(status)}${node.core ? " · 核心" : ""}</text>
</g>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#fbfaff"/>
  <defs>
    <pattern id="grid" width="18" height="18" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="#dcd8f3"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)"/>
  <text x="40" y="48" font-size="30" font-weight="900" fill="#111322" font-family="Arial, Microsoft YaHei">${escape(route.title)}</text>
  <text x="40" y="78" font-size="15" fill="#666b87" font-family="Arial, Microsoft YaHei">${escape(route.summary)}</text>
  <g transform="translate(0 90)">
    ${edges}
    ${nodes}
  </g>
</svg>`;
}

function routeFilename(route: MaopuRoute, extension: string) {
  return `${route.title.replace(/[\\/:*?"<>|]/g, "-")}.${extension}`;
}

function Logo() {
  return (
    <div className="flex shrink-0 items-center gap-3 whitespace-nowrap font-black text-3xl">
      <div className="grid h-11 w-11 place-items-center rounded-full border border-brand-100 bg-gradient-to-br from-white to-brand-100 text-xl text-brand-500 shadow-soft">
        猫
      </div>
      <span>猫扑</span>
    </div>
  );
}

function PrimaryButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`shrink-0 whitespace-nowrap rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 px-7 py-4 font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-panel disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-soft ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function OutlineButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`shrink-0 whitespace-nowrap rounded-xl border border-brand-500 bg-white px-6 py-3 font-bold text-brand-500 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function MobileNav({ setView, compact = false }: { setView: (view: View) => void; compact?: boolean }) {
  const items: Array<{ icon: React.ComponentType<{ className?: string }>; label: string; view: View }> = [
    { icon: Home, label: "首页", view: "landing" },
    { icon: UploadCloud, label: "上传", view: "upload" },
    { icon: Library, label: "社区", view: "community" },
    { icon: GraduationCap, label: "我的", view: "universe" }
  ];

  return (
    <nav className={`grid grid-cols-4 gap-2 lg:hidden ${compact ? "px-4 py-3" : "mx-auto mt-5 max-w-[1440px]"}`} aria-label="移动端导航">
      {items.map(({ icon: Icon, label, view }) => (
        <button
          key={view}
          type="button"
          onClick={() => setView(view)}
          className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-2 text-sm font-black text-muted shadow-soft transition hover:border-brand-500 hover:text-brand-500"
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function MascotStyleSwitch({
  variant,
  onChange,
  compact = false
}: {
  variant: MascotVariant;
  onChange: (variant: MascotVariant) => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "text-xs" : "text-sm"}`} aria-label="切换小扑状态">
      {mascotStyles.map((style) => (
        <button
          key={style.value}
          type="button"
          onClick={() => onChange(style.value)}
          title={style.description}
          className={`flex items-center gap-2 rounded-full border font-black transition ${compact ? "px-2 py-1.5" : "px-3 py-2"} ${
            variant === style.value ? "border-brand-500 bg-brand-50 text-brand-500" : "border-line bg-white text-muted hover:border-brand-500 hover:text-brand-500"
          }`}
        >
          <img
            src={style.avatar}
            alt=""
            className={`${compact ? "mascot-switch-thumb-compact" : "mascot-switch-thumb"} rounded-full bg-white object-cover object-top`}
          />
          <span>{style.label}</span>
        </button>
      ))}
    </div>
  );
}

const mascotStageImages: Record<MascotVariant, {
  main: string;
  avatar: string;
  mainAlt: string;
  mainClass: string;
  note: string;
  cues: string[];
}> = {
  planner: {
    main: "/maopu-images/mascot-planner.png",
    avatar: "/maopu-images/mascot-avatar-planner.png",
    mainAlt: "猫小扑挥手精神状态",
    mainClass: "right-[-5%] h-[92%]",
    note: "精神上线，先把目标拆成能走的路线。",
    cues: ["轻呼吸", "挥手摆动", "状态同步"]
  },
  coder: {
    main: "/maopu-images/mascot-study-desk.png",
    avatar: "/maopu-images/mascot-avatar-coder.png",
    mainAlt: "猫小扑桌前学习状态",
    mainClass: "right-[-8%] h-[88%]",
    note: "进入学习模式，陪你把节点和依赖关系写清楚。",
    cues: ["伏案微动", "笔记节奏", "专注视线"]
  },
  idea: {
    main: "/maopu-images/mascot-idea.png",
    avatar: "/maopu-images/mascot-avatar-idea.png",
    mainAlt: "猫小扑灵感状态",
    mainClass: "right-[-6%] h-[92%]",
    note: "灵感弹出，适合把模糊想法变成路线草案。",
    cues: ["上浮提示", "亮点闪烁", "轻快弹入"]
  },
  thinking: {
    main: "/maopu-images/mascot-thinking.png",
    avatar: "/maopu-images/mascot-avatar-thinking.png",
    mainAlt: "猫小扑思考状态",
    mainClass: "right-[-5%] h-[92%]",
    note: "认真思考，帮你判断前置知识和学习顺序。",
    cues: ["慢速摇摆", "疑问停顿", "稳定呼吸"]
  },
  sleepy: {
    main: "/maopu-images/mascot-sleepy.png",
    avatar: "/maopu-images/mascot-avatar-sleepy.png",
    mainAlt: "猫小扑困困打哈欠状态",
    mainClass: "right-[-7%] h-[92%]",
    note: "困困陪学，节奏放慢但不会把你丢下。",
    cues: ["慢点头", "轻摇头", "睡意漂浮"]
  },
  happy: {
    main: "/maopu-images/mascot-happy.png",
    avatar: "/maopu-images/mascot-avatar-happy.png",
    mainAlt: "猫小扑开心鼓励状态",
    mainClass: "right-[-6%] h-[92%]",
    note: "完成一个节点后，小扑切到开心鼓励状态。",
    cues: ["挥手回弹", "轻快漂浮", "完成反馈"]
  }
};

function MascotAvatar({ variant, className = "" }: { variant: MascotVariant; className?: string }) {
  const mascot = mascotStageImages[variant];

  return (
    <span className={`mascot-avatar-live mascot-avatar-live-${variant} relative block overflow-hidden rounded-full border border-brand-100 bg-white shadow-soft ${className}`}>
      <img src={mascot.avatar} alt={`${mascotStyles.find((style) => style.value === variant)?.label ?? "小扑"}状态头像`} className="h-full w-full object-cover object-top" />
    </span>
  );
}

function MascotStage({ variant, onChange }: { variant: MascotVariant; onChange: (variant: MascotVariant) => void }) {
  const imgs = mascotStageImages[variant];

  return (
    <div className={`mascot-stage mascot-stage-${variant} relative min-h-[580px] overflow-hidden rounded-[2rem] border border-brand-100 bg-white shadow-soft`}>
      <div className="absolute left-6 top-6 z-30 max-w-[340px] rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-soft backdrop-blur">
        <p className="text-sm font-bold text-muted">小扑状态</p>
        <MascotStyleSwitch variant={variant} onChange={onChange} compact />
      </div>

      <AnimatePresence mode="wait">
        <motion.img
          key={`main-${variant}`}
          src={imgs.main}
          alt={imgs.mainAlt}
          className={`mascot-live mascot-live-${variant} absolute bottom-0 max-w-none object-contain object-bottom z-10 ${imgs.mainClass}`}
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 6 }}
          transition={{ duration: 0.38, ease: "easeOut" }}
        />
      </AnimatePresence>

      <div className="absolute bottom-6 left-6 z-20 max-w-[430px] rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-soft backdrop-blur">
        <p className="text-sm font-bold text-muted">路线从你的输入开始</p>
        <p className="mt-1 text-xl font-black">{imgs.note}</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-muted">
          {imgs.cues.map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-500" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LandingPage({
  goal,
  setGoal,
  generating,
  recognizing,
  recognition,
  mascotVariant,
  onMascotVariantChange,
  onRecognize,
  onGenerate,
  onNewRoute,
  setView
}: {
  goal: string;
  setGoal: (goal: string) => void;
  generating: boolean;
  recognizing: boolean;
  recognition: RecognitionResult | null;
  mascotVariant: MascotVariant;
  onMascotVariantChange: (variant: MascotVariant) => void;
  onRecognize: (input: string) => void;
  onGenerate: (goal: string) => void;
  onNewRoute: () => void;
  setView: (view: View) => void;
}) {
  const starterPrompts = [
    "我现在零基础，想三个月做出一个能展示的 Web 项目",
    "我学过一点 Python，想转向 AI 应用开发",
    "我准备计算机相关面试，需要补齐项目和基础",
    "我有一份课程资料，想整理成可执行学习路线"
  ];

  function submit(event: FormEvent) {
    event.preventDefault();
    onGenerate(goal);
  }

  return (
    <main className="min-h-screen px-6 py-7 lg:px-16">
      <header className="mx-auto flex max-w-[1440px] items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-9 text-lg font-bold lg:flex">
          <button onClick={() => setView("upload")} className="hover:text-brand-500">
            上传资料
          </button>
          <button onClick={() => setView("community")} className="hover:text-brand-500">
            社区
          </button>
          <button onClick={() => setView("universe")} className="hover:text-brand-500">
            我的学习
          </button>
          <button
            type="button"
            onClick={() => document.getElementById("goal")?.focus()}
            className="rounded-full p-2 transition hover:bg-brand-50 hover:text-brand-500"
            aria-label="聚焦目标输入"
          >
            <Search className="h-7 w-7" />
          </button>
          <button
            type="button"
            onClick={() => setView("universe")}
            className="rounded-full p-1 text-brand-500 transition hover:bg-brand-50"
            aria-label="打开我的学习"
          >
            <CircleUserRound className="h-10 w-10" />
          </button>
        </nav>
      </header>
      <MobileNav setView={setView} />

      <section className="mx-auto grid max-w-[1440px] items-center gap-10 pb-12 pt-12 lg:grid-cols-[1.05fr_.95fr] lg:pt-20">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-2 font-bold text-brand-500 shadow-soft">
            <Compass className="h-5 w-5" />
            路线规划工作台
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal sm:text-5xl lg:text-7xl">先识别你的目标，再规划路线。</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">
            不从预设模板开始。你描述目标、基础、时间和资料，猫扑先识别学习需求，再生成一张属于你的知识地图。
          </p>

          <form onSubmit={submit} className="mt-8 rounded-3xl border border-brand-100 bg-white p-4 shadow-soft sm:mt-10 sm:p-5">
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-2 text-lg font-black" htmlFor="goal">
                <Sparkles className="h-5 w-5 text-brand-500" />
                描述你的目标、基础或手头资料
              </label>
              <textarea
                id="goal"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                className="min-h-32 resize-y rounded-2xl border border-line px-5 py-4 text-base font-semibold leading-7 outline-none focus:border-brand-500 sm:min-h-36 sm:text-lg sm:leading-8"
                placeholder="例如：我会一点 HTML/CSS，想在 8 周内做出一个能放进简历的全栈项目；或者粘贴课程大纲、考试范围、岗位 JD..."
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <OutlineButton type="button" onClick={() => onRecognize(goal)} disabled={recognizing || !goal.trim()} className="flex items-center justify-center gap-2 disabled:opacity-50">
                  <Search className="h-5 w-5" />
                  {recognizing ? "正在识别..." : "先识别需求"}
                </OutlineButton>
                <PrimaryButton type="submit" disabled={generating || !goal.trim()} className="flex min-w-56 items-center justify-center gap-2 disabled:opacity-60">
                  <Send className="h-5 w-5" />
                  {generating ? "正在规划..." : "生成专属路线"}
                </PrimaryButton>
                <OutlineButton type="button" onClick={onNewRoute} className="flex items-center justify-center gap-2">
                  <Plus className="h-5 w-5" />
                  空白地图
                </OutlineButton>
              </div>
            </div>
          </form>

          <div className="mt-7 flex flex-wrap gap-3">
            {starterPrompts.map((example) => (
              <button
                key={example}
                onClick={() => setGoal(example)}
                className="rounded-xl border border-line bg-white px-4 py-3 text-left font-bold text-ink transition hover:border-brand-500 hover:text-brand-500"
              >
                {example}
              </button>
            ))}
          </div>

          {recognition && (
            <div className="mt-7 rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-black">识别结果</h2>
                <button onClick={() => onGenerate(recognition.prompt)} className="rounded-xl bg-brand-500 px-5 py-3 font-bold text-white">
                  用它规划
                </button>
              </div>
              <p className="mt-4 text-lg font-black text-brand-500">{recognition.goal}</p>
              <p className="mt-3 leading-7 text-muted">{recognition.profile}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {recognition.keywords.map((item) => (
                  <span key={item} className="rounded-full bg-brand-50 px-3 py-2 text-sm font-bold text-brand-500">
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-4 grid gap-2 text-sm font-bold text-muted">
                {recognition.constraints.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <MascotStage variant={mascotVariant} onChange={onMascotVariantChange} />
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-5 pb-16 lg:grid-cols-3">
        {[
          { title: "目标识别", text: "把零散想法、岗位 JD、课程大纲整理成清晰学习目标。", Icon: Search },
          { title: "路线规划", text: "生成知识节点、前置关系、学习路径、项目和资源。", Icon: MapIcon },
          { title: "手动编辑", text: "路线不是一次性答案，你可以继续添加、删除、调整节点。", Icon: Pencil }
        ].map(({ title, text, Icon }) => (
          <div key={title} className="rounded-2xl border border-line bg-white p-7 shadow-soft">
            <Icon className="mb-6 h-8 w-8 text-brand-500" />
            <h3 className="text-2xl font-black">{title}</h3>
            <p className="mt-4 leading-7 text-muted">{text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

function KnowledgeMapNode({ data }: { data: KnowledgeNode }) {
  const style = domainStyles[data.domain];
  const statusLabel = data.status === "learned" ? "已学习" : data.status === "learning" ? "学习中" : "未学习";

  return (
    <button
      className={`group min-w-[170px] rounded-2xl border-2 bg-white px-5 py-4 text-left shadow-soft transition hover:-translate-y-1 ${
        data.core ? "min-w-[230px] py-5" : ""
      } ${data.status === "unlearned" ? "opacity-75 grayscale-[.1]" : ""}`}
      style={{ borderColor: style.border, background: data.status === "unlearned" ? "#ffffff" : style.bg, color: style.color }}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={`${data.core ? "text-2xl" : "text-lg"} font-black`}>{data.title}</div>
          <div className="mt-3 flex items-center gap-2 text-sm font-bold">
            {data.status !== "unlearned" && (
              <span className="grid h-5 w-5 place-items-center rounded-md bg-emerald-500 text-white">
                <Check className="h-3.5 w-3.5" />
              </span>
            )}
            <span>{statusLabel}</span>
          </div>
        </div>
        {data.core && <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-black">核心</span>}
      </div>
    </button>
  );
}

const nodeTypes = { knowledge: KnowledgeMapNode };

function MapCanvas({
  route,
  selectedNodeId,
  onSelect,
  onMoveNode
}: {
  route: MaopuRoute;
  selectedNodeId: string | null;
  onSelect: (node: KnowledgeNode) => void;
  onMoveNode: (id: string, position: { x: number; y: number }) => void;
}) {
  const { fitView } = useReactFlow();
  const nodes: Node<KnowledgeNode>[] = useMemo(
    () =>
      route.nodes.map((node) => ({
        id: node.id,
        type: "knowledge",
        position: node.position,
        data: node,
        selected: node.id === selectedNodeId
      })),
    [route, selectedNodeId]
  );
  const edges: Edge[] = useMemo(
    () =>
      route.edges.map((edge) => {
        const source = route.nodes.find((node) => node.id === edge.source);
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          animated: edge.kind === "related",
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
          style: {
            strokeWidth: edge.kind === "dependency" ? 2.3 : 1.6,
            strokeDasharray: edge.kind === "related" ? "6 6" : undefined,
            stroke: source ? domainStyles[source.domain].border : "#9aa6ff"
          }
        };
      }),
    [route]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={(_, node) => onSelect(node.data)}
      onNodeDragStop={(_, node) => onMoveNode(node.id, node.position)}
      defaultViewport={{ x: 55, y: 115, zoom: 0.72 }}
      minZoom={0.35}
      maxZoom={1.55}
      fitView
      fitViewOptions={{ padding: 0.14 }}
      className="map-grid"
    >
      <Background color="#dcd8f3" gap={18} size={1} />
      {route.nodes.length > 0 && (
        <MiniMap
          pannable
          zoomable
          position="top-left"
          className="!left-5 !top-5 !h-36 !w-56 overflow-hidden !rounded-2xl !border !border-line !bg-white/90 !shadow-soft"
          nodeColor={(node) => domainStyles[(node.data as KnowledgeNode).domain].border}
        />
      )}
      <Controls position="top-right" className="!right-5 !top-5 !overflow-hidden !rounded-2xl !border !border-line !shadow-soft" />
      <button
        onClick={() => fitView({ padding: 0.16, duration: 500 })}
        className="absolute bottom-6 left-6 z-10 rounded-xl border border-line bg-white px-4 py-3 font-bold text-brand-500 shadow-soft"
      >
        查看全图
      </button>
    </ReactFlow>
  );
}

function linesToText(items: string[]) {
  return items.join("\n");
}

function textToLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function CoursePanel({
  node,
  onClose,
  onUpdate,
  onDelete
}: {
  node: KnowledgeNode | null;
  onClose: () => void;
  onUpdate: (node: KnowledgeNode) => void;
  onDelete: (nodeId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<KnowledgeNode | null>(node);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    setDraft(node);
    setEditing(false);
    setConfirmingDelete(false);
  }, [node]);

  function updateDraft(partial: Partial<KnowledgeNode>) {
    setDraft((current) => (current ? { ...current, ...partial } : current));
  }

  function saveDraft() {
    if (!draft) return;
    const title = draft.title.trim();
    if (!title) return;
    onUpdate({ ...draft, title });
    setEditing(false);
    setConfirmingDelete(false);
  }

  function toggleEditing() {
    if (editing) {
      setDraft(node);
      setEditing(false);
      setConfirmingDelete(false);
      return;
    }

    setEditing(true);
    setConfirmingDelete(false);
  }

  function requestDeleteNode() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    onDelete(node!.id);
  }

  return (
    <AnimatePresence>
      {node && draft && (
        <motion.aside
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 240 }}
          className="absolute bottom-5 right-5 top-5 z-20 flex w-[min(420px,calc(100%-40px))] flex-col rounded-3xl border border-line bg-white shadow-panel"
        >
          <div className="flex items-start justify-between border-b border-line p-7">
            <div>
              <p className="mb-3 text-sm font-bold text-muted">{domainStyles[node.domain].label}</p>
              <h2 className="text-4xl font-black">{editing ? "编辑节点" : node.title}</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleEditing}
                className="rounded-xl border border-line p-3 text-muted hover:text-brand-500"
                title={editing ? "取消编辑" : "编辑节点"}
              >
                <Pencil className="h-5 w-5" />
              </button>
              <button onClick={onClose} className="rounded-xl border border-line p-3 text-muted hover:text-ink" title="关闭">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="soft-scrollbar flex-1 overflow-y-auto p-7">
            {editing ? (
              <div className="space-y-5">
                <label className="block">
                  <span className="font-black">课程名</span>
                  <input
                    value={draft.title}
                    onChange={(event) => updateDraft({ title: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-line px-4 py-3 font-semibold outline-none focus:border-brand-500"
                  />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="font-black">领域</span>
                    <select
                      value={draft.domain}
                      onChange={(event) => updateDraft({ domain: event.target.value as Domain })}
                      className="mt-2 w-full rounded-xl border border-line px-4 py-3 font-semibold outline-none focus:border-brand-500"
                    >
                      {domainOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="font-black">状态</span>
                    <select
                      value={draft.status}
                      onChange={(event) => updateDraft({ status: event.target.value as LearningStatus })}
                      className="mt-2 w-full rounded-xl border border-line px-4 py-3 font-semibold outline-none focus:border-brand-500"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 font-bold">
                  <input
                    type="checkbox"
                    checked={draft.core}
                    onChange={(event) => updateDraft({ core: event.target.checked })}
                    className="h-5 w-5"
                  />
                  核心节点
                </label>
                <EditorTextarea title="第一性原理解释" value={draft.why} onChange={(value) => updateDraft({ why: value })} />
                <EditorTextarea title="解决的问题（一行一个）" value={linesToText(draft.problems)} onChange={(value) => updateDraft({ problems: textToLines(value) })} />
                <EditorTextarea title="前置知识（一行一个）" value={linesToText(draft.prerequisites)} onChange={(value) => updateDraft({ prerequisites: textToLines(value) })} />
                <EditorTextarea title="学习路径（一行一个）" value={linesToText(draft.path)} onChange={(value) => updateDraft({ path: textToLines(value) })} />
                <EditorTextarea title="推荐项目（一行一个）" value={linesToText(draft.projects)} onChange={(value) => updateDraft({ projects: textToLines(value) })} />
                <EditorTextarea title="推荐资源（一行一个）" value={linesToText(draft.resources)} onChange={(value) => updateDraft({ resources: textToLines(value) })} />
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <PrimaryButton disabled={!draft.title.trim()} onClick={saveDraft} className="py-3 disabled:cursor-not-allowed disabled:opacity-50">
                    保存节点
                  </PrimaryButton>
                  <OutlineButton onClick={() => setDraft(node)} className="py-3">
                    重置
                  </OutlineButton>
                </div>
                <button
                  onClick={requestDeleteNode}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-black ${
                    confirmingDelete ? "border-red-500 bg-red-600 text-white" : "border-red-200 bg-red-50 text-red-600"
                  }`}
                >
                  <Trash2 className="h-5 w-5" />
                  {confirmingDelete ? "再次点击确认删除" : "删除节点"}
                </button>
              </div>
            ) : (
              <>
                <section>
                  <h3 className="text-2xl font-black">为什么会有这门课？</h3>
                  <p className="mt-4 leading-8 text-muted">{node.why}</p>
                </section>
                <section className="mt-8">
                  <h3 className="text-xl font-black">它解决什么问题？</h3>
                  <ul className="mt-4 space-y-3">
                    {node.problems.map((item) => (
                      <li key={item} className="rounded-xl bg-brand-50 px-4 py-3 font-semibold text-ink">
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
                <InfoList title="前置知识" items={node.prerequisites} />
                <InfoList title="推荐学习路径" items={node.path} />
                <InfoList title="推荐项目" items={node.projects} />
                <InfoList title="推荐资源" items={node.resources} />
              </>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function EditorTextarea({ title, value, onChange }: { title: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="font-black">{title}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="mt-2 w-full resize-y rounded-xl border border-line px-4 py-3 leading-7 outline-none focus:border-brand-500"
      />
    </label>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mt-8">
      <h3 className="text-xl font-black">{title}</h3>
      <div className="mt-4 flex flex-wrap gap-3">
        {items.map((item) => (
          <span key={item} className="rounded-xl border border-line bg-white px-4 py-3 font-semibold text-muted">
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function Assistant({
  route,
  selectedNode,
  mascotVariant,
  onMascotVariantChange
}: {
  route: MaopuRoute;
  selectedNode: KnowledgeNode | null;
  mascotVariant: MascotVariant;
  onMascotVariantChange: (variant: MascotVariant) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AssistantAction>("next");
  const [message, setMessage] = useState("选一个动作，小扑会根据当前路线给你建议。");
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const currentNode = selectedNode ?? route.nodes[0] ?? null;
  const target = currentNode?.title ?? route.title;
  const actionButtonClass = (action: AssistantAction) =>
    `px-3 py-3 text-sm ${mode === action ? "!border-brand-500 !bg-brand-50 !text-brand-500" : ""}`;

  async function requestAssistant(action: AssistantAction, nextQuestion?: string) {
    setMode(action);
    setLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route, currentNode, action, question: nextQuestion })
      });

      if (!response.ok) throw new Error(await readApiError(response, "小扑暂时连不上 AI 服务"));
      const data = (await response.json()) as { message?: string };
      setMessage(data.message || "小扑暂时没想好，但你可以先从当前节点的前置知识开始。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "小扑暂时连不上 AI 服务";
      setMessage(`${message}。先看当前节点的前置知识，再做一个小项目验证理解。`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    void requestAssistant("next");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNode, open, route]);

  function submitQuestion(event: FormEvent) {
    event.preventDefault();
    const nextQuestion = question.trim();
    if (!nextQuestion || loading) return;
    void requestAssistant("ask", nextQuestion);
    setQuestion("");
  }


  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex max-w-[calc(100vw-3rem)] items-center gap-3 rounded-2xl border border-brand-100 bg-white p-3 pr-5 shadow-panel transition hover:-translate-y-1"
      >
        <MascotAvatar variant={mascotVariant} className="h-16 w-16" />
        <span className="text-left">
          <span className="block text-sm font-bold text-muted">小扑</span>
          <span className="block font-black text-brand-500">问我路线问题</span>
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            className="fixed bottom-28 right-6 z-50 w-[calc(100vw-3rem)] max-w-[390px] rounded-3xl border border-line bg-white p-6 shadow-panel"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <MascotAvatar variant={mascotVariant} className="h-16 w-16" />
                <div>
                  <h3 className="text-2xl font-black">小扑</h3>
                  <p className="font-semibold text-muted">安静的知识导航员</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-xl border border-line p-2" aria-label="关闭小扑助手">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-violet-500 p-5 text-lg font-bold leading-8 text-white">
              你现在正在看：{target}。我会先帮你理解它为什么存在，再推荐下一步。
            </div>
            <div className="mt-4 rounded-2xl border border-line bg-white p-3">
              <p className="mb-2 text-xs font-black text-muted">切换小扑状态</p>
              <MascotStyleSwitch variant={mascotVariant} onChange={onMascotVariantChange} compact />
            </div>
            <div className="mt-4 min-h-32 rounded-2xl border border-line p-5 font-semibold leading-7 text-ink">
              {loading ? "小扑正在看这张地图..." : message}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <OutlineButton disabled={loading} onClick={() => requestAssistant("explain")} className={actionButtonClass("explain")}>
                解释概念
              </OutlineButton>
              <OutlineButton disabled={loading} onClick={() => requestAssistant("resource")} className={actionButtonClass("resource")}>
                推荐资源
              </OutlineButton>
              <OutlineButton disabled={loading} onClick={() => requestAssistant("next")} className={actionButtonClass("next")}>
                下一步学什么
              </OutlineButton>
            </div>
            <form onSubmit={submitQuestion} className="mt-4 flex gap-2">
              <label className="sr-only" htmlFor="assistant-question">
                问小扑
              </label>
              <input
                id="assistant-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-line px-4 py-3 font-semibold outline-none focus:border-brand-500"
                placeholder="问一个路线问题"
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                title="发送问题"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MapPage({
  route,
  selectedNode,
  setSelectedNode,
  setView,
  onSave,
  onNewRoute,
  onAddNode,
  onUpdateNode,
  onDeleteNode,
  onMoveNode,
  onShare,
  onExport,
  mascotVariant,
  onMascotVariantChange
}: {
  route: MaopuRoute;
  selectedNode: KnowledgeNode | null;
  setSelectedNode: (node: KnowledgeNode | null) => void;
  setView: (view: View) => void;
  onSave: () => void;
  onNewRoute: () => void;
  onAddNode: () => void;
  onUpdateNode: (node: KnowledgeNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onMoveNode: (id: string, position: { x: number; y: number }) => void;
  onShare: () => void;
  onExport: (kind: "markdown" | "json" | "svg") => void;
  mascotVariant: MascotVariant;
  onMascotVariantChange: (variant: MascotVariant) => void;
}) {
  const learned = route.nodes.filter((node) => node.status === "learned").length;
  const learning = route.nodes.filter((node) => node.status === "learning").length;
  const progress = calculateProgress(route);
  const health = useMemo(() => analyzeRouteHealth(route), [route]);
  const [search, setSearch] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [searchMiss, setSearchMiss] = useState("");
  const exportOptions: Array<{ kind: "markdown" | "json" | "svg"; label: string }> = [
    { kind: "markdown", label: "Markdown" },
    { kind: "json", label: "JSON" },
    { kind: "svg", label: "SVG 地图" }
  ];
  const sidebarItems: MapSidebarItem[] = [
    { icon: MapIcon, label: "地图", active: true, onClick: () => setView("map") },
    { icon: Plus, label: "节点", onClick: onAddNode },
    { icon: CheckCircle2, label: "保存", onClick: onSave },
    { icon: Share2, label: "分享", onClick: onShare },
    { icon: Download, label: "导出", onClick: () => setExportOpen((value) => !value) },
    { icon: UploadCloud, label: "导入", onClick: () => setView("upload") },
    { icon: Boxes, label: "新线", onClick: onNewRoute },
    { icon: CircleUserRound, label: "我的", onClick: () => setView("universe") }
  ];

  function findNode() {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return;
    const match = route.nodes.find((node) => node.title.toLowerCase().includes(keyword));
    if (match) {
      setSelectedNode(match);
      setSearchMiss("");
    } else {
      setSearchMiss(`没有找到「${search.trim()}」`);
    }
  }

  return (
    <main className="h-screen overflow-hidden bg-white">
      <header className="flex h-20 items-center justify-between border-b border-line px-7">
        <div className="flex items-center gap-7">
          <Logo />
          <div className="hidden items-center gap-2 whitespace-nowrap rounded-xl border border-line bg-white px-4 py-3 font-bold text-muted 2xl:flex">
            <Search className="h-5 w-5 text-brand-500" />
            我的路线 <ChevronRight className="h-4 w-4" /> {route.title}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 font-bold text-muted 2xl:flex">
            <Search className="h-5 w-5" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") findNode();
              }}
              placeholder="搜索知识点"
              className="w-32 bg-transparent outline-none"
            />
          </div>
          {searchMiss && <span className="hidden rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600 2xl:inline">{searchMiss}</span>}
          <OutlineButton onClick={onSave} className="hidden items-center gap-2 2xl:flex">
            <CheckCircle2 className="h-5 w-5" />
            保存
          </OutlineButton>
          <OutlineButton onClick={onAddNode} className="hidden items-center gap-2 2xl:flex">
            <Plus className="h-5 w-5" />
            节点
          </OutlineButton>
          <OutlineButton onClick={() => setView("upload")} className="hidden 2xl:block">
            导入路线
          </OutlineButton>
          <OutlineButton onClick={onShare} className="hidden items-center gap-2 2xl:flex">
            <Share2 className="h-5 w-5" />
            分享
          </OutlineButton>
          <div className="relative hidden 2xl:block">
            <OutlineButton onClick={() => setExportOpen((value) => !value)} className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              导出
            </OutlineButton>
            {exportOpen && (
              <div className="absolute right-0 top-14 z-30 w-44 rounded-2xl border border-line bg-white p-2 shadow-panel">
                {exportOptions.map(({ kind, label }) => (
                  <button
                    key={kind}
                    onClick={() => {
                      onExport(kind);
                      setExportOpen(false);
                    }}
                    className="block w-full rounded-xl px-4 py-3 text-left font-bold text-muted hover:bg-brand-50 hover:text-brand-500"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setView("universe")} className="rounded-xl border border-line p-3" aria-label="打开我的学习">
            <CircleUserRound className="h-6 w-6 text-brand-500" />
          </button>
        </div>
      </header>

      <div className="grid h-[calc(100vh-80px)] grid-cols-[76px_1fr] sm:grid-cols-[96px_1fr]">
        <aside className="flex min-h-0 flex-col items-center gap-2 overflow-y-auto border-r border-line bg-white px-2 py-3 sm:gap-4 sm:px-3 sm:py-6">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              aria-label={item.label}
              className={`flex w-full flex-col items-center gap-1.5 rounded-2xl py-3 text-xs font-black sm:gap-2 sm:py-4 sm:text-sm ${
                item.active ? "bg-brand-50 text-brand-500" : "text-muted hover:bg-brand-50"
              }`}
            >
              <item.icon className="h-6 w-6" />
              {item.label}
            </button>
          ))}
        </aside>

        <section className="relative">
          {exportOpen && (
            <div className="absolute left-6 top-6 z-30 w-44 rounded-2xl border border-line bg-white p-2 shadow-panel 2xl:hidden">
              {exportOptions.map(({ kind, label }) => (
                <button
                  key={kind}
                  onClick={() => {
                    onExport(kind);
                    setExportOpen(false);
                  }}
                  className="block w-full rounded-xl px-4 py-3 text-left font-bold text-muted hover:bg-brand-50 hover:text-brand-500"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {route.nodes.length > 0 && (
            <div className="absolute left-4 top-4 z-10 max-h-[calc(100vh-128px)] w-[min(620px,calc(100%-32px))] overflow-y-auto rounded-3xl border border-line bg-white/92 p-4 shadow-soft backdrop-blur sm:left-6 sm:top-6 sm:w-[min(620px,calc(100%-48px))] sm:p-5">
              <h1 className="text-2xl font-black sm:text-3xl">{route.title}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{route.description}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
                <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700">{learned} 已点亮</span>
                <span className="rounded-full bg-amber-50 px-3 py-2 text-amber-700">{learning} 学习中</span>
                <span className="rounded-full bg-brand-50 px-3 py-2 text-brand-500">{route.nodes.length} 节点</span>
              </div>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs font-black text-muted">
                  <span>路线进度</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-brand-50">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-line bg-white/80 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black text-muted">路线体检</p>
                    <p className="mt-1 text-sm font-bold text-muted">{health.summary}</p>
                  </div>
                  <strong
                    className={`rounded-xl px-3 py-2 text-lg ${
                      health.score >= 85
                        ? "bg-emerald-50 text-emerald-700"
                        : health.score >= 65
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {health.score}
                  </strong>
                </div>
                <div className="mt-3 grid gap-2">
                  {health.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 text-sm font-bold text-muted">
                      {item.tone === "ok" ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${item.tone === "danger" ? "text-rose-600" : "text-amber-600"}`} />
                      )}
                      <span>
                        <span className="text-ink">{item.label}</span>
                        <span className="ml-1 font-semibold">{item.detail}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-sm font-bold leading-6 text-brand-500">
                  下一步：{health.nextAction}
                </p>
              </div>
            </div>
          )}
          {route.nodes.length === 0 && (
            <div className="absolute left-1/2 top-1/2 z-20 w-[min(520px,calc(100%-48px))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-brand-100 bg-white/94 p-8 text-center shadow-panel backdrop-blur">
              <Compass className="mx-auto h-10 w-10 text-brand-500" />
              <h2 className="mt-4 text-3xl font-black">从空白路线开始</h2>
              <p className="mt-3 leading-7 text-muted">你可以手动添加第一个知识点，也可以回到首页描述目标，让猫扑识别并规划整条路线。</p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <PrimaryButton onClick={onAddNode} className="flex items-center justify-center gap-2">
                  <Plus className="h-5 w-5" />
                  添加节点
                </PrimaryButton>
                <OutlineButton onClick={() => setView("landing")} className="flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  识别目标
                </OutlineButton>
              </div>
            </div>
          )}
          <ReactFlowProvider>
            <MapCanvas route={route} selectedNodeId={selectedNode?.id ?? null} onSelect={setSelectedNode} onMoveNode={onMoveNode} />
          </ReactFlowProvider>
          <CoursePanel node={selectedNode} onClose={() => setSelectedNode(null)} onUpdate={onUpdateNode} onDelete={onDeleteNode} />
          <Assistant route={route} selectedNode={selectedNode} mascotVariant={mascotVariant} onMascotVariantChange={onMascotVariantChange} />
        </section>
      </div>
    </main>
  );
}

function UploadPage({
  onGenerate,
  onImportRoute,
  notify,
  setView
}: {
  onGenerate: (goal: string) => void;
  onImportRoute: (route: MaopuRoute) => void;
  notify: (message: string) => void;
  setView: (view: View) => void;
}) {
  const [fileName, setFileName] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [parseSummary, setParseSummary] = useState("");
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasMaterial = Boolean(sourceText.trim() || githubUrl.trim());

  async function handleFile(file: File) {
    setParsing(true);
    setFileName(file.name);
    try {
      if (file.name.toLowerCase().endsWith(".json")) {
        const text = await file.text();
        const trimmed = text.trim();
        const rawJson = JSON.parse(trimmed);
        const parsed = normalizeImportedRoute(rawJson);
        if (parsed) {
          notify("已导入 JSON 路线");
          onImportRoute(parsed);
          return;
        }

        const routePack = normalizeImportedRoutePack(rawJson);
        if (routePack.length) {
          const savedRoutes = safeSavedRoutes();
          const seenIds = new Set<string>();
          const mergedRoutes = [...routePack, ...savedRoutes].filter((item) => {
            const id = routeStorageId(item);
            if (seenIds.has(id)) return false;
            seenIds.add(id);
            return true;
          }).slice(0, 12);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedRoutes));
          notify(`已导入 ${routePack.length} 条迁移路线`);
          onImportRoute(routePack[0]);
          return;
        }
      }

      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/parse-material", {
        method: "POST",
        body: form
      });
      if (!response.ok) throw new Error(await readApiError(response, "资料解析失败"));
      const parsed = (await response.json()) as { text: string; summary: string; sourceName: string; sourceType: string };
      setSourceText(parsed.text);
      setParseSummary(parsed.summary);
      notify(`已解析 ${parsed.sourceName}`);
    } catch (error) {
      const fallback = `我上传了 ${file.name}，文件大小约 ${Math.round(file.size / 1024)}KB。请根据文件主题为我规划学习路线。`;
      setSourceText(fallback);
      const message = error instanceof Error ? error.message : "解析失败";
      setParseSummary(`${message}，已保留文件名和大小作为路线生成线索。`);
      notify("文件未完整解析，已保留文件信息");
    } finally {
      setParsing(false);
    }
  }

  async function parseExternalUrl() {
    const url = githubUrl.trim();
    if (!url) {
      notify("请先填写 GitHub 或网页链接");
      return;
    }

    setParsing(true);
    try {
      const response = await fetch("/api/parse-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      if (!response.ok) throw new Error(await readApiError(response, "链接解析失败"));
      const parsed = (await response.json()) as { text: string; summary: string; sourceName: string };
      setSourceText((current) => [current.trim(), parsed.text].filter(Boolean).join("\n\n"));
      setParseSummary(parsed.summary);
      notify(`已解析 ${parsed.sourceName}`);
    } catch (error) {
      setSourceText((current) => [current.trim(), `链接：${url}\n请根据该链接代表的项目或资料规划学习路线。`].filter(Boolean).join("\n\n"));
      const message = error instanceof Error ? error.message : "链接抓取失败";
      setParseSummary(`${message}，已把链接本身加入资料。`);
      notify("链接未完整解析，已保留链接作为线索");
    } finally {
      setParsing(false);
    }
  }

  function submitMaterial() {
    const material = [sourceText.trim(), githubUrl.trim() ? `GitHub 链接：${githubUrl.trim()}` : ""].filter(Boolean).join("\n\n");
    if (!material) {
      notify("请先选择文件、粘贴资料或填写 GitHub 链接");
      return;
    }
    onGenerate(`请识别以下学习资料并生成知识路线：\n${material.slice(0, 6000)}`);
  }

  return (
    <Shell title="上传解析中心" setView={setView}>
      <div className="mx-auto grid max-w-[1440px] gap-6 px-6 py-8 sm:gap-10 sm:py-12 lg:grid-cols-[1.45fr_.85fr]">
        <section className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-8">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".txt,.md,.markdown,.json,.csv,.tsv,.pdf,.xlsx"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.currentTarget.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files?.[0];
              if (file) void handleFile(file);
            }}
            className="grid min-h-[240px] w-full place-items-center rounded-3xl border-2 border-dashed border-brand-100 bg-brand-50/30 px-4 text-center transition hover:border-brand-500 sm:min-h-[300px]"
          >
            <div>
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white text-brand-500 shadow-soft sm:h-24 sm:w-24">
                <UploadCloud className="h-10 w-10 sm:h-12 sm:w-12" />
              </span>
              <h2 className="mt-6 text-2xl font-black sm:mt-7 sm:text-4xl">选择或拖入学习资料</h2>
              <p className="mt-3 text-base leading-7 text-muted sm:mt-4 sm:text-xl">支持 Markdown / JSON 路线 / CSV / 文本 / PDF / XLSX，解析后可直接生成路线</p>
              <span className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 px-6 py-3 font-bold text-white shadow-soft sm:mt-8 sm:px-7 sm:py-4">
                {parsing ? "正在读取..." : fileName || "选择文件"}
              </span>
            </div>
          </button>

          <label className="mt-7 block text-lg font-black sm:mt-8 sm:text-xl" htmlFor="sourceText">
            资料内容
          </label>
          <textarea
            id="sourceText"
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            className="mt-3 min-h-40 w-full resize-y rounded-2xl border border-line px-5 py-4 leading-7 outline-none focus:border-brand-500 sm:min-h-52"
            placeholder="可以粘贴课程大纲、岗位 JD、考试范围、学习笔记，猫扑会先识别再生成路线。"
          />
          {parseSummary && <p className="mt-3 rounded-xl bg-brand-50 px-4 py-3 font-bold text-brand-500">{parseSummary}</p>}

          <label className="mt-6 block text-lg font-black sm:text-xl" htmlFor="githubUrl">
            GitHub / 网页链接
          </label>
          <input
            id="githubUrl"
            value={githubUrl}
            onChange={(event) => setGithubUrl(event.target.value)}
            className="mt-3 w-full rounded-2xl border border-line px-5 py-4 font-semibold outline-none focus:border-brand-500"
            placeholder="https://github.com/owner/repo 或课程网页链接"
          />

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <OutlineButton disabled={parsing || !githubUrl.trim()} onClick={() => void parseExternalUrl()} className="flex items-center justify-center gap-2 disabled:opacity-50">
              <GitFork className="h-5 w-5" />
              解析链接
            </OutlineButton>
            <PrimaryButton disabled={parsing || !hasMaterial} onClick={submitMaterial} className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5" />
              识别资料并生成路线
            </PrimaryButton>
            <OutlineButton
              disabled={parsing || !hasMaterial}
              onClick={() => {
                setSourceText("");
                setGithubUrl("");
                setFileName("");
                setParseSummary("");
                notify("已清空导入内容");
              }}
            >
              清空
            </OutlineButton>
          </div>
        </section>
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-10">
          <h2 className="text-2xl font-black sm:text-3xl">支持的格式</h2>
          {[
            [FileText, "文本 / Markdown", "直接读取内容并交给 AI 识别"],
            [Layers3, "JSON 路线", "符合 Route 结构时可直接导入地图"],
            [Code2, "CSV / 表格文本", "可根据课程清单生成路线"],
            [FileText, "PDF / XLSX", "抽取文档文本和工作表内容"],
            [GitFork, "GitHub 链接", "作为资料来源纳入路线规划"]
          ].map(([Icon, title, desc]) => (
            <div key={String(title)} className="mt-7 flex gap-4 sm:mt-10 sm:gap-5">
              <Icon className="h-8 w-8 shrink-0 text-ink sm:h-10 sm:w-10" />
              <div>
                <h3 className="text-xl font-black sm:text-2xl">{String(title)}</h3>
                <p className="mt-2 text-base leading-7 text-muted sm:text-xl">{String(desc)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function CommunityPage({
  currentRoute,
  onGenerate,
  onLoadBuiltin,
  notify,
  setView
}: {
  currentRoute: MaopuRoute;
  onGenerate: (goal: string) => void;
  onLoadBuiltin: (route: MaopuRoute) => void;
  notify: (message: string) => void;
  setView: (view: View) => void;
}) {
  const [activeTab, setActiveTab] = useState("热门");
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishVisibility, setPublishVisibility] = useState<"private" | "public" | "unlisted">("unlisted");
  const [publishedRoutes, setPublishedRoutes] = useState<MaopuRoute[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem(FAVORITES_KEY) || "[]") as string[];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    setPublishedRoutes(safePublishedRoutes());
  }, []);

  const publishedCards: CommunityRouteCard[] = publishedRoutes.map((item) => ({
    title: item.title,
    author: publishVisibilityLabel((item as MaopuRoute & { visibility?: CommunityRouteCard["visibility"] }).visibility ?? "unlisted"),
    rating: "本地",
    learners: `${item.nodes.length} 节点`,
    categories: ["我的发布", "最新", "收藏"],
    prompt: "",
    builtinRoute: item,
    source: "local",
    visibility: (item as MaopuRoute & { visibility?: CommunityRouteCard["visibility"] }).visibility ?? "unlisted"
  }));
  const allCards = [...publishedCards, ...routeCards.map((card) => ({ ...card, source: "builtin" as const }))];
  const tabs = ["热门", "精选", "最新", "我的发布", "考研", "就业", "AI", "游戏开发", "CS 基础", "收藏"];
  const filteredCards =
    activeTab === "收藏" ? allCards.filter((card) => favorites.includes(card.title)) : allCards.filter((card) => card.categories.includes(activeTab));

  function publishVisibilityLabel(visibility: CommunityRouteCard["visibility"]) {
    if (visibility === "public") return "我发布 · 公开";
    if (visibility === "private") return "我发布 · 私有草稿";
    return "我发布 · 链接可见";
  }

  function toggleFavorite(title: string) {
    setFavorites((current) => {
      const next = current.includes(title) ? current.filter((item) => item !== title) : [...current, title];
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      notify(next.includes(title) ? "已收藏路线" : "已取消收藏");
      return next;
    });
  }

  function forkRoute(card: CommunityRouteCard) {
    if (card.builtinRoute) {
      onLoadBuiltin({
        ...card.builtinRoute,
        title: `${card.builtinRoute.title}（我的 Fork）`,
        summary: `${card.builtinRoute.summary} 已复制为可编辑路线。`,
        nodes: card.builtinRoute.nodes.map((node) => ({ ...node })),
        edges: card.builtinRoute.edges.map((edge) => ({ ...edge }))
      });
      notify("已 Fork 精选路线");
      return;
    }

    onGenerate(`Fork 并定制这条路线：${card.prompt}`);
  }

  function publishCurrentRoute() {
    if (!currentRoute.nodes.length) {
      notify("当前路线还没有节点，先生成或添加节点");
      setView("map");
      return;
    }

    const routeForPublish = {
      ...currentRoute,
      title: currentRoute.title,
      summary: `${currentRoute.summary} 已保存为本地社区发布草稿。`,
      visibility: publishVisibility
    } as MaopuRoute & { visibility: "private" | "public" | "unlisted" };
    const next = [routeForPublish, ...safePublishedRoutes().filter((item) => item.title !== routeForPublish.title)].slice(0, 12);
    window.localStorage.setItem(PUBLISHED_ROUTES_KEY, JSON.stringify(next));
    setPublishedRoutes(next);
    setActiveTab("我的发布");
    setPublishOpen(false);
    notify("已发布到本地社区草稿");
  }

  function deletePublishedRoute(title: string) {
    const next = safePublishedRoutes().filter((item) => item.title !== title);
    window.localStorage.setItem(PUBLISHED_ROUTES_KEY, JSON.stringify(next));
    setPublishedRoutes(next);
    notify("已删除本地发布草稿");
  }

  async function shareRoute(card: CommunityRouteCard) {
    const text = card.builtinRoute
      ? `${card.title}
${card.builtinRoute.description}
节点数：${card.builtinRoute.nodes.length}
摘要：${card.builtinRoute.summary}`
      : `${card.title} - ${card.prompt}`;
    try {
      await navigator.clipboard.writeText(text);
      notify("路线信息已复制，可发给别人");
    } catch {
      notify("浏览器限制剪贴板，路线信息暂未复制");
    }
  }

  return (
    <Shell title="路线社区" setView={setView}>
      <div className="mx-auto max-w-[1440px] px-6 py-12">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-5">
          <div className="flex flex-wrap gap-4 text-xl font-bold">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-2xl px-7 py-4 ${activeTab === tab ? "bg-brand-50 text-brand-500" : "text-muted hover:bg-brand-50"}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <OutlineButton onClick={() => setPublishOpen((value) => !value)}>发布当前路线</OutlineButton>
            <PrimaryButton onClick={() => setView("landing")}>创建路线</PrimaryButton>
          </div>
        </div>
        {publishOpen && (
          <section className="mb-8 rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-brand-500">本地社区发布</p>
                <h2 className="mt-2 text-3xl font-black">{currentRoute.title}</h2>
                <p className="mt-3 max-w-3xl leading-7 text-muted">
                  先把当前路线发布到本地社区草稿。接入 Supabase 后，这里会写入 `routes.visibility` 并生成真实公开页。
                </p>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-2 text-sm font-black text-brand-500">{currentRoute.nodes.length} 节点</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {[
                ["unlisted", "链接可见"],
                ["public", "公开"],
                ["private", "私有草稿"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPublishVisibility(value as "private" | "public" | "unlisted")}
                  className={`rounded-xl border px-4 py-3 font-black ${
                    publishVisibility === value ? "border-brand-500 bg-brand-50 text-brand-500" : "border-line text-muted hover:border-brand-500 hover:text-brand-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <PrimaryButton onClick={publishCurrentRoute}>保存发布草稿</PrimaryButton>
              <OutlineButton onClick={() => setPublishOpen(false)}>取消</OutlineButton>
            </div>
          </section>
        )}
        {filteredCards.length === 0 ? (
          <div className="rounded-3xl border border-line bg-white p-12 text-center shadow-soft">
            <Library className="mx-auto h-10 w-10 text-brand-500" />
            <h2 className="mt-4 text-3xl font-black">这里还没有路线</h2>
            <p className="mt-3 text-muted">收藏几条路线后，它们会出现在这里。</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCards.map((card) => (
            <article key={card.title} className="flex min-h-[520px] flex-col justify-between rounded-3xl border border-line bg-white p-8 shadow-soft">
              <div>
                <div className="flex items-start gap-3">
                  <h2 className="text-3xl font-black leading-tight">{card.title}</h2>
                  {card.builtinRoute && (
                    <span className="mt-1 shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-black text-brand-500 border border-brand-100">
                      {card.source === "local" ? "本地" : "精选"}
                    </span>
                  )}
                </div>
                <p className="mt-8 min-h-24 text-lg leading-7 text-muted">
                  {card.builtinRoute ? card.builtinRoute.description : card.prompt}
                </p>
                <p className="mt-8 text-xl text-muted">{card.author}</p>
                <p className="mt-6 flex items-center gap-5 text-xl">
                  <span className="text-amber-500">★ {card.rating}</span>
                  <span className="text-muted">{card.learners} 人学习</span>
                </p>
              </div>
              <div className="grid gap-3">
                {card.builtinRoute ? (
                  <OutlineButton onClick={() => onLoadBuiltin(card.builtinRoute!)}>
                    直接打开路线 →
                  </OutlineButton>
                ) : (
                  <OutlineButton onClick={() => onGenerate(card.prompt)}>生成这条路线</OutlineButton>
                )}
                <div className="flex justify-between text-muted">
                  <button
                    onClick={() => toggleFavorite(card.title)}
                    title="收藏路线"
                    aria-label={`${favorites.includes(card.title) ? "取消收藏" : "收藏"}${card.title}`}
                    className={favorites.includes(card.title) ? "text-rose-500" : "hover:text-rose-500"}
                  >
                    <Heart className="h-6 w-6" />
                  </button>
                  <button onClick={() => forkRoute(card)} title="Fork 路线" aria-label={`Fork ${card.title}`} className="hover:text-brand-500">
                    <GitFork className="h-6 w-6" />
                  </button>
                  <button onClick={() => void shareRoute(card)} title="复制分享" aria-label={`复制分享 ${card.title}`} className="hover:text-brand-500">
                    <Share2 className="h-6 w-6" />
                  </button>
                  {card.source === "local" && (
                    <button onClick={() => deletePublishedRoute(card.title)} title="删除发布草稿" aria-label={`删除发布草稿 ${card.title}`} className="hover:text-rose-500">
                      <Trash2 className="h-6 w-6" />
                    </button>
                  )}
                </div>
              </div>
            </article>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function explainAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "邮箱或密码不正确";
  if (lower.includes("email not confirmed")) return "邮箱还没有验证，请先检查验证邮件";
  if (lower.includes("user already registered") || lower.includes("already registered")) return "这个邮箱已经注册过，可以直接登录或重置密码";
  if (lower.includes("password")) return "密码不符合要求，请至少使用 6 位字符";
  if (lower.includes("rate limit") || lower.includes("too many")) return "请求太频繁，请稍后再试";
  if (lower.includes("signup")) return "注册暂时失败，请检查 Supabase 邮箱注册设置";
  return message || "账号服务暂时不可用，请稍后再试";
}

function AccountSyncPanel({ routes, notify }: { routes: MaopuRoute[]; notify: (message: string) => void }) {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authDraft, setAuthDraft] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [authLoading, setAuthLoading] = useState(false);
  const [mailLoading, setMailLoading] = useState(false);
  const [sessionEmail, setSessionEmail] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const supabaseReady = hasSupabaseBrowserConfig();
  const routeCount = routes.length;
  const email = authDraft.email.trim().toLowerCase();
  const passwordReady = authDraft.password.length >= 6;
  const passwordsMatch = authMode !== "register" || authDraft.password === authDraft.confirmPassword;
  const canSubmitAuth = supabaseReady && !authLoading && isValidEmail(email) && passwordReady && passwordsMatch && (authMode === "login" || Boolean(authDraft.name.trim()));
  const authTasks = [
    { icon: KeyRound, title: "登录 / 注册", text: "配置 Supabase 后启用邮箱账号、注册确认和会话保持。" },
    { icon: ShieldCheck, title: "权限保护", text: "路线、收藏和学习记录按用户隔离，公开路线再单独发布。" },
    { icon: LockKeyhole, title: "云端同步", text: "把本地路线迁移到数据库，并用短分享链接替代压缩 hash。" }
  ];

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSessionEmail(data.session?.user.email ?? "");
      })
      .catch(() => {
        if (active) setSessionEmail("");
      });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSessionEmail(session?.user.email ?? "");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  function updateAuthDraft(field: keyof typeof authDraft, value: string) {
    setAuthDraft((current) => ({ ...current, [field]: value }));
    setAuthNotice("");
  }

  async function submitAuthPreview(event: FormEvent) {
    event.preventDefault();
    if (!email || !authDraft.password.trim()) {
      notify("请先填写邮箱和密码");
      return;
    }
    if (!isValidEmail(email)) {
      notify("邮箱格式不正确");
      return;
    }
    if (authMode === "register" && !authDraft.name.trim()) {
      notify("注册时需要填写昵称");
      return;
    }
    if (authDraft.password.length < 6) {
      notify("密码至少 6 位");
      return;
    }
    if (authMode === "register" && authDraft.password !== authDraft.confirmPassword) {
      notify("两次输入的密码不一致");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      notify("请先配置 Supabase URL 和 publishable key");
      return;
    }

    setAuthLoading(true);
    const password = authDraft.password;
    try {
      const result =
        authMode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: { data: { name: authDraft.name.trim() }, emailRedirectTo: window.location.origin }
            });

      if (result.error) {
        const message = explainAuthError(result.error.message);
        setAuthNotice(message);
        notify(message);
        return;
      }

      setSessionEmail(result.data.session?.user.email ?? result.data.user?.email ?? "");
      setAuthDraft((current) => ({ ...current, password: "", confirmPassword: "" }));
      const message = authMode === "login" ? "已登录账号" : result.data.session ? "账号已创建并登录" : "账号已创建，请检查邮箱完成验证";
      setAuthNotice(message);
      notify(message);
    } catch (error) {
      const message = error instanceof Error ? explainAuthError(error.message) : "账号服务暂时不可用，请稍后再试";
      setAuthNotice(message);
      notify(message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      setAuthLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        notify(error.message);
        return;
      }

      setSessionEmail("");
      notify("已退出登录");
    } catch {
      notify("退出登录失败，请稍后再试");
    } finally {
      setAuthLoading(false);
    }
  }

  function exportMigrationPack() {
    if (!routes.length) {
      notify("还没有可迁移的本地路线");
      return;
    }

    downloadText(
      "maopu-local-routes-migration.json",
      JSON.stringify(
        {
          version: 1,
          exportedAt: new Date().toISOString(),
          source: "maopu.localStorage",
          routes
        },
        null,
        2
      ),
      "application/json;charset=utf-8"
    );
    notify("已导出本地路线迁移包");
  }

  async function copySchemaSql() {
    try {
      await navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
      notify("Supabase 建表 SQL 已复制");
    } catch {
      notify("浏览器限制剪贴板，暂未复制 SQL");
    }
  }

  async function sendPasswordReset() {
    if (!email || !isValidEmail(email)) {
      notify("请先填写有效邮箱");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      notify("请先配置 Supabase URL 和 publishable key");
      return;
    }

    try {
      setMailLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (error) {
        const message = explainAuthError(error.message);
        setAuthNotice(message);
        notify(message);
        return;
      }
      const message = "重置密码邮件已发送，请检查邮箱";
      setAuthNotice(message);
      notify(message);
    } catch (error) {
      const message = error instanceof Error ? explainAuthError(error.message) : "重置邮件发送失败，请稍后再试";
      setAuthNotice(message);
      notify(message);
    } finally {
      setMailLoading(false);
    }
  }

  async function resendSignupEmail() {
    if (!email || !isValidEmail(email)) {
      notify("请先填写有效邮箱");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      notify("请先配置 Supabase URL 和 publishable key");
      return;
    }

    try {
      setMailLoading(true);
      const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: window.location.origin } });
      if (error) {
        const message = explainAuthError(error.message);
        setAuthNotice(message);
        notify(message);
        return;
      }
      const message = "验证邮件已重新发送";
      setAuthNotice(message);
      notify(message);
    } catch (error) {
      const message = error instanceof Error ? explainAuthError(error.message) : "验证邮件发送失败，请稍后再试";
      setAuthNotice(message);
      notify(message);
    } finally {
      setMailLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft sm:p-9">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-brand-500">账号体系</p>
          <h2 className="mt-2 text-3xl font-black">账号登录与迁移准备</h2>
        </div>
        <span className={`rounded-full px-3 py-2 text-sm font-black ${supabaseReady ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {supabaseReady ? "Auth 已就绪" : "待配置"}
        </span>
      </div>
      <p className="mt-4 leading-7 text-muted">
        当前有 {routeCount} 条路线在本地浏览器里。配置 Supabase 后可以登录或注册账号；路线云端迁移包也已经可以导出，方便下一步接数据库。
      </p>
      {!supabaseReady && (
        <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
          当前没有配置 Supabase 环境变量，所以这里不会创建真实账号。需要在 `.env.local` 中配置
          `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`，并重启本地服务后才能调用 Supabase Auth。
        </div>
      )}
      {sessionEmail && (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">当前账号</p>
            <p className="mt-1 break-all font-bold text-emerald-900">{sessionEmail}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={authLoading}
            className="rounded-xl border border-emerald-200 bg-white px-4 py-2 font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            退出登录
          </button>
        </div>
      )}
      <form onSubmit={submitAuthPreview} className="mt-6 rounded-2xl border border-line bg-brand-50/30 p-4">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-white p-1">
          {[
            ["login", "登录"],
            ["register", "注册"]
          ].map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setAuthMode(mode as AuthMode);
                setAuthNotice("");
                setAuthDraft((current) => ({ ...current, password: "", confirmPassword: "" }));
              }}
              className={`rounded-lg px-4 py-2 font-black transition ${authMode === mode ? "bg-brand-500 text-white" : "text-muted hover:bg-brand-50 hover:text-brand-500"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {authMode === "register" && (
          <label className="mt-4 block">
            <span className="text-sm font-black">昵称</span>
            <input
              value={authDraft.name}
              onChange={(event) => updateAuthDraft("name", event.target.value)}
              className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-semibold outline-none focus:border-brand-500"
              placeholder="猫扑学习者"
            />
          </label>
        )}
        <label className="mt-4 block">
          <span className="text-sm font-black">邮箱</span>
          <input
            type="email"
            value={authDraft.email}
            onChange={(event) => updateAuthDraft("email", event.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-semibold outline-none focus:border-brand-500"
            placeholder="you@example.com"
          />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-black">密码</span>
          <input
            type="password"
            value={authDraft.password}
            onChange={(event) => updateAuthDraft("password", event.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-semibold outline-none focus:border-brand-500"
            placeholder="至少 6 位"
          />
        </label>
        {authMode === "register" && (
          <label className="mt-4 block">
            <span className="text-sm font-black">确认密码</span>
            <input
              type="password"
              value={authDraft.confirmPassword}
              onChange={(event) => updateAuthDraft("confirmPassword", event.target.value)}
              className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-semibold outline-none focus:border-brand-500"
              placeholder="再输入一次密码"
            />
          </label>
        )}
        <div className="mt-3 rounded-xl bg-white px-4 py-3 text-sm font-bold leading-6 text-muted">
          {authMode === "register" ? (
            <>
              <span className={passwordReady ? "text-emerald-700" : "text-muted"}>密码至少 6 位</span>
              <span className="px-2">·</span>
              <span className={passwordsMatch ? "text-emerald-700" : "text-rose-600"}>两次密码一致</span>
            </>
          ) : (
            "忘记密码可以直接向当前邮箱发送重置邮件。"
          )}
        </div>
        {authNotice && <p className="mt-3 rounded-xl bg-white px-4 py-3 text-sm font-bold leading-6 text-brand-500">{authNotice}</p>}
        <button
          type="submit"
          disabled={!canSubmitAuth}
          title={supabaseReady ? undefined : "请先配置 Supabase 环境变量"}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 font-black text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <KeyRound className="h-5 w-5" />
          {authLoading ? "处理中..." : !supabaseReady ? "先配置 Supabase" : authMode === "login" ? "登录账号" : "创建账号"}
        </button>
        <p className="mt-3 text-sm font-semibold leading-6 text-muted">
          这里只负责 Supabase Auth 登录/注册；路线云端同步还需要接入数据库写入和 RLS 权限规则。
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void sendPasswordReset()}
            disabled={!supabaseReady || mailLoading || !isValidEmail(email)}
            className="flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3 font-black text-muted transition hover:border-brand-500 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            重置密码
          </button>
          <button
            type="button"
            onClick={() => void resendSignupEmail()}
            disabled={!supabaseReady || mailLoading || !isValidEmail(email)}
            className="flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3 font-black text-muted transition hover:border-brand-500 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            重发验证邮件
          </button>
        </div>
      </form>
      <div className="mt-6 grid gap-3">
        {authTasks.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-4 rounded-2xl border border-line bg-white p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-500">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-black">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={exportMigrationPack}
          className="flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 py-3 font-black text-muted transition hover:border-brand-500 hover:text-brand-500"
        >
          <Download className="h-5 w-5" />
          导出迁移包
        </button>
        <button
          type="button"
          onClick={() => void copySchemaSql()}
          className="flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 py-3 font-black text-muted transition hover:border-brand-500 hover:text-brand-500"
        >
          <Copy className="h-5 w-5" />
          复制建表 SQL
        </button>
      </div>
    </section>
  );
}

function ProductReadinessPanel({ routes, publishedCount, shareCount }: { routes: MaopuRoute[]; publishedCount: number; shareCount: number }) {
  const supabaseReady = hasSupabaseBrowserConfig();
  const averageHealth = routes.length
    ? Math.round(routes.reduce((total, item) => total + analyzeRouteHealth(item).score, 0) / routes.length)
    : 0;
  const checks = [
    {
      label: "本地路线",
      value: `${routes.length} 条`,
      ready: routes.length > 0,
      detail: routes.length > 0 ? "已有可迁移数据" : "还没有路线数据"
    },
    {
      label: "本地发布",
      value: `${publishedCount} 条`,
      ready: publishedCount > 0,
      detail: publishedCount > 0 ? "社区草稿已开始沉淀" : "可从社区页发布当前路线"
    },
    {
      label: "分享记录",
      value: `${shareCount} 条`,
      ready: shareCount > 0,
      detail: shareCount > 0 ? "已有路线被分享过" : "分享后会记录到本地历史"
    },
    {
      label: "Supabase",
      value: supabaseReady ? "已配置" : "未配置",
      ready: supabaseReady,
      detail: supabaseReady ? "前端公开变量已就绪" : "需要配置 URL 和 publishable key"
    },
    {
      label: "路线质量",
      value: `${averageHealth}%`,
      ready: averageHealth >= 70,
      detail: averageHealth >= 70 ? "路线结构适合分享" : "继续补依赖、资源和核心节点"
    }
  ];

  return (
    <section className="rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-9">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-brand-500">产品自检</p>
          <h2 className="mt-2 text-3xl font-black">上线前状态</h2>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-2 text-sm font-black text-brand-500">{checks.filter((item) => item.ready).length}/{checks.length}</span>
      </div>
      <div className="mt-6 grid gap-3">
        {checks.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-4 rounded-2xl border border-line p-4">
            <div className="flex gap-3">
              {item.ready ? (
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-600" />
              )}
              <div>
                <h3 className="font-black">{item.label}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{item.detail}</p>
              </div>
            </div>
            <strong className={item.ready ? "text-emerald-700" : "text-amber-700"}>{item.value}</strong>
          </div>
        ))}
      </div>
      <p className="mt-5 rounded-2xl bg-brand-50 p-4 text-sm font-semibold leading-6 text-muted">
        AI key 是服务端私密变量，不在前端暴露；以 `/api/generate-route`、`/api/assistant` 是否正常响应作为线上验证。
      </p>
    </section>
  );
}

function UniversePage({
  currentRoute,
  onOpenRoute,
  onNewRoute,
  notify,
  setView
}: {
  currentRoute: MaopuRoute;
  onOpenRoute: (route: MaopuRoute) => void;
  onNewRoute: () => void;
  notify: (message: string) => void;
  setView: (view: View) => void;
}) {
  const [savedRoutes, setSavedRoutes] = useState<MaopuRoute[]>([]);
  const [publishedCount, setPublishedCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [pendingDeleteRouteId, setPendingDeleteRouteId] = useState("");

  useEffect(() => {
    setSavedRoutes(safeSavedRoutes());
    setPublishedCount(safePublishedRoutes().length);
    setShareCount(safeShareHistory().length);
  }, []);

  const routes = savedRoutes.length ? savedRoutes : currentRoute.nodes.length ? [currentRoute] : [];
  const allNodes = routes.flatMap((item) => item.nodes);
  const learnedCount = allNodes.filter((node) => node.status === "learned").length;
  const projectCount = allNodes.reduce((total, node) => total + node.projects.length, 0);
  const currentProgress = routes[0] ? calculateProgress(routes[0]) : 0;
  const recentNodes = routes[0]?.nodes.filter((node) => node.status !== "unlearned").slice(0, 4) ?? [];

  function deleteSavedRoute(route: MaopuRoute) {
    const deleteId = routeStorageId(route);
    if (pendingDeleteRouteId !== deleteId) {
      setPendingDeleteRouteId(deleteId);
      notify("再次点击删除按钮确认删除路线");
      return;
    }

    const next = safeSavedRoutes().filter((item) => routeStorageId(item) !== routeStorageId(route) && item.title !== route.title);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSavedRoutes(next);
    setPendingDeleteRouteId("");
    notify("已删除本地路线");
  }

  return (
    <Shell title="我的学习" setView={setView}>
      <div className="mx-auto grid max-w-[1440px] items-start gap-6 px-6 py-8 sm:gap-10 sm:py-12 xl:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)]">
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-9">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-3xl font-black">我的路线</h2>
            <button onClick={onNewRoute} className="rounded-xl bg-brand-50 px-4 py-3 font-black text-brand-500">
              新建
            </button>
          </div>
          {routes.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-brand-100 p-8 text-center">
              <Boxes className="mx-auto h-10 w-10 text-brand-500" />
              <h3 className="mt-4 text-2xl font-black">还没有保存路线</h3>
              <p className="mt-2 text-muted">生成或手动创建路线后，会自动出现在这里。</p>
              <PrimaryButton onClick={() => setView("landing")} className="mt-6">
                去规划路线
              </PrimaryButton>
            </div>
          ) : (
            routes.map((item, index) => {
              const progress = calculateProgress(item);
              const status = progress >= 100 ? "已完成" : progress > 0 ? "学习中" : "未开始";
              const color = progress >= 100 ? "bg-emerald-100 text-emerald-600" : progress > 0 ? "bg-amber-100 text-amber-600" : "bg-brand-50 text-brand-500";
              const deletePending = pendingDeleteRouteId === routeStorageId(item);
              return (
                <div key={`${item.title}-${index}`} className="flex flex-wrap items-center gap-4 border-b border-line py-6 sm:flex-nowrap sm:gap-5 sm:py-8">
                  <button onClick={() => onOpenRoute(item)} className={`grid h-16 w-16 place-items-center rounded-2xl ${color}`} aria-label={`打开路线 ${item.title}`}>
                    <Boxes className="h-8 w-8" />
                  </button>
                  <button onClick={() => onOpenRoute(item)} className="min-w-0 flex-1 text-left">
                    <h3 className="truncate text-2xl font-black">{item.title}</h3>
                    <p className="mt-2 text-lg text-muted">{status} · {item.nodes.length} 节点</p>
                  </button>
                  <span className="font-bold text-brand-500">{progress}%</span>
                  <button
                    onClick={() => deleteSavedRoute(item)}
                    className={`rounded-xl border p-2 ${
                      deletePending ? "border-rose-500 bg-rose-50 text-rose-600" : "border-line text-muted hover:text-rose-500"
                    }`}
                    title={deletePending ? "再次点击确认删除" : "删除路线"}
                    aria-label={`${deletePending ? "确认删除路线" : "删除路线"} ${item.title}`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <button onClick={() => onOpenRoute(item)} className="rounded-xl border border-line p-2 text-muted hover:text-brand-500" title="打开路线" aria-label={`打开路线 ${item.title}`}>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              );
            })
          )}
          <button onClick={() => setView("community")} className="mt-8 font-black text-brand-500">
            查看社区路线 <ChevronRight className="inline h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-6">
          <ProductReadinessPanel routes={routes} publishedCount={publishedCount} shareCount={shareCount} />
          <AccountSyncPanel routes={routes} notify={notify} />
          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-9">
            <h2 className="text-3xl font-black">学习概览</h2>
            <div className="mt-8 grid grid-cols-3 gap-3 border-b border-line pb-8 text-center text-muted sm:mt-9 sm:gap-4 sm:pb-9">
              {[
                ["已学知识点", String(learnedCount)],
                ["保存路线", String(routes.length)],
                ["项目建议", String(projectCount)]
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="font-semibold">{label}</p>
                  <strong className="mt-3 block text-3xl text-ink sm:text-5xl">{value}</strong>
                </div>
              ))}
            </div>
            <h3 className="mt-10 text-2xl font-black">最近学习</h3>
            {recentNodes.length ? (
              recentNodes.map((item, index) => (
                  <div key={item.id} className="mt-7 flex items-center justify-between text-xl text-muted">
                    <span className="flex items-center gap-3">
                      <BookOpen className="h-6 w-6 text-brand-500" />
                      {item.title}
                    </span>
                    <span>{index === 0 ? "刚刚" : `${index + 1} 个节点前`}</span>
                  </div>
                ))
            ) : (
              <p className="mt-7 leading-7 text-muted">还没有学习记录。打开一条路线，把节点状态改成“学习中”或“已学习”后，这里会更新。</p>
            )}
            <div className="mt-10 rounded-2xl bg-brand-50 p-5">
              <p className="font-black text-brand-500">当前路线进度</p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${currentProgress}%` }} />
              </div>
              <p className="mt-3 text-sm font-bold text-muted">{currentProgress}%</p>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ title, children, setView }: { title: string; children: React.ReactNode; setView: (view: View) => void }) {
  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-line bg-white px-5 py-5 sm:px-7">
        <Logo />
        <nav className="hidden items-center gap-7 text-lg font-bold lg:flex">
          <button onClick={() => setView("landing")} className="flex items-center gap-2 hover:text-brand-500">
            <Home className="h-5 w-5" />
            首页
          </button>
          <button onClick={() => setView("map")} className="flex items-center gap-2 hover:text-brand-500">
            <Compass className="h-5 w-5" />
            地图
          </button>
          <button onClick={() => setView("community")} className="flex items-center gap-2 hover:text-brand-500">
            <Library className="h-5 w-5" />
            社区
          </button>
          <button onClick={() => setView("universe")} className="flex items-center gap-2 hover:text-brand-500">
            <GraduationCap className="h-5 w-5" />
            我的学习
          </button>
        </nav>
      </header>
      <MobileNav setView={setView} compact />
      <div className="mx-auto max-w-[1440px] px-6 pt-8 sm:pt-10">
        <h1 className="text-4xl font-black sm:text-5xl">{title}</h1>
      </div>
      {children}
    </main>
  );
}

export default function HomePage() {
  const [view, setView] = useState<View>("landing");
  const [goal, setGoal] = useState("");
  const [route, setRoute] = useState<MaopuRoute>(() => createBlankRoute());
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [generating, setGenerating] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [recognition, setRecognition] = useState<RecognitionResult | null>(null);
  const [mascotVariant, setMascotVariant] = useState<MascotVariant>("planner");
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [view]);

  useEffect(() => {
    const savedMascotStyle = window.localStorage.getItem(MASCOT_STYLE_KEY);
    if (mascotStyles.some((style) => style.value === savedMascotStyle)) {
      setMascotVariant(savedMascotStyle as MascotVariant);
    }

    const sharedRoute = decodeSharedRoute(window.location.hash);
    if (sharedRoute) {
      setRoute(sharedRoute);
      setView("map");
      saveRoute(sharedRoute, { silent: true });
      notify("已打开分享路线");
      return;
    }

    const routes = safeSavedRoutes();
    if (routes[0]) setRoute(routes[0]);
  }, []);

  function updateMascotVariant(nextVariant: MascotVariant) {
    setMascotVariant(nextVariant);
    window.localStorage.setItem(MASCOT_STYLE_KEY, nextVariant);
    notify(`已切换小扑状态：${mascotStyles.find((style) => style.value === nextVariant)?.label ?? "小扑"}`);
  }

  function notify(message: string) {
    const id = Date.now();
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2400);
  }

  function saveRoute(nextRoute = route, options: { silent?: boolean } = {}) {
    const routes = safeSavedRoutes();
    const nextId = routeStorageId(nextRoute);
    const withoutCurrent = routes.filter((item) => routeStorageId(item) !== nextId && item.title !== nextRoute.title);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([nextRoute, ...withoutCurrent].slice(0, 12)));
      if (!options.silent) notify("路线已保存到本地");
    } catch {
      if (!options.silent) notify("本地存储空间不足，路线暂未保存");
    }
  }

  function importRoute(nextRoute: MaopuRoute) {
    const normalizedRoute = normalizeImportedRoute(nextRoute) ?? nextRoute;
    setRoute(normalizedRoute);
    setSelectedNode(null);
    saveRoute(normalizedRoute);
    setView("map");
  }

  function openRoute(nextRoute: MaopuRoute) {
    setRoute(nextRoute);
    setSelectedNode(null);
    setView("map");
    notify("已打开路线");
  }

  function newRoute() {
    const next = createBlankRoute("未命名知识路线");
    setRoute(next);
    setSelectedNode(null);
    setView("map");
    notify("已创建空白路线");
  }

  function addNode() {
    const id = `node-${Date.now()}`;
    const nextNode: KnowledgeNode = {
      id,
      title: "新知识点",
      domain: "programming",
      core: false,
      status: "unlearned",
      position: { x: 240 + route.nodes.length * 36, y: 220 + route.nodes.length * 18 },
      why: "这门知识被加入路线，是因为它解决了当前学习目标中的一个关键结构问题。",
      problems: ["它解决什么问题？"],
      prerequisites: ["前置知识"],
      path: ["学习步骤"],
      projects: ["练习项目"],
      resources: ["推荐资源"]
    };
    const nextRoute = { ...route, nodes: [...route.nodes, nextNode] };
    setRoute(nextRoute);
    setSelectedNode(nextNode);
    saveRoute(nextRoute);
  }

  function updateNode(nextNode: KnowledgeNode) {
    const nextRoute = {
      ...route,
      nodes: route.nodes.map((node) => (node.id === nextNode.id ? nextNode : node))
    };
    setRoute(nextRoute);
    setSelectedNode(nextNode);
    saveRoute(nextRoute);
  }

  function deleteNode(nodeId: string) {
    const nextRoute = {
      ...route,
      nodes: route.nodes.filter((node) => node.id !== nodeId),
      edges: route.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    };
    setRoute(nextRoute);
    setSelectedNode(null);
    saveRoute(nextRoute);
  }

  function moveNode(id: string, position: { x: number; y: number }) {
    const nextRoute = {
      ...route,
      nodes: route.nodes.map((node) => (node.id === id ? { ...node, position } : node))
    };
    setRoute(nextRoute);
    saveRoute(nextRoute, { silent: true });
  }

  function exportRoute(kind: "markdown" | "json" | "svg") {
    if (route.nodes.length === 0) {
      notify("空白路线还没有可导出的节点");
      return;
    }

    if (kind === "markdown") {
      downloadText(routeFilename(route, "md"), routeToMarkdown(route), "text/markdown;charset=utf-8");
    }
    if (kind === "json") {
      downloadText(routeFilename(route, "json"), JSON.stringify(route, null, 2), "application/json;charset=utf-8");
    }
    if (kind === "svg") {
      downloadText(routeFilename(route, "svg"), routeToSvg(route), "image/svg+xml;charset=utf-8");
    }
    notify("导出文件已生成");
  }

  async function shareCurrentRoute() {
    if (route.nodes.length === 0) {
      notify("空白路线还不能分享");
      return;
    }

    const hash = `route=${encodeRouteForShare(route)}`;
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    const shareRecord: ShareRecord = {
      id: routeStorageId(route),
      title: route.title,
      sharedAt: new Date().toISOString()
    };
    const nextShareHistory = [shareRecord, ...safeShareHistory().filter((item) => item.id !== shareRecord.id)].slice(0, 20);
    window.localStorage.setItem(SHARE_HISTORY_KEY, JSON.stringify(nextShareHistory));
    try {
      await navigator.clipboard.writeText(url);
      notify("分享链接已复制");
    } catch {
      window.location.hash = hash;
      notify("已生成分享链接，可从地址栏复制");
    }
  }

  function withToasts(children: React.ReactNode) {
    return (
      <>
        {children}
        <div className="fixed right-6 top-6 z-[80] space-y-3">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                className="rounded-2xl border border-brand-100 bg-white px-5 py-4 font-bold text-brand-500 shadow-panel"
              >
                {toast.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </>
    );
  }

  async function generateRoute(nextGoal: string) {
    const plannedGoal = nextGoal.trim();
    if (!plannedGoal) {
      notify("先描述你的学习目标或资料");
      return;
    }

    setGoal(plannedGoal);
    setGenerating(true);
    setSelectedNode(null);

    try {
      const response = await fetch("/api/generate-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: plannedGoal })
      });
      if (!response.ok) throw new Error(await readApiError(response, "AI 路线生成暂不可用"));
      const data = (await response.json()) as MaopuRoute;
      setRoute(data);
      saveRoute(data);
    } catch (error) {
      const fallback = routeForGoal(plannedGoal);
      setRoute(fallback);
      saveRoute(fallback);
      notify(`${error instanceof Error ? error.message : "AI 路线生成暂不可用"}，已使用本地路线`);
    } finally {
      window.setTimeout(() => {
        setGenerating(false);
        setView("map");
      }, 260);
    }
  }

  async function recognizeRoute(input: string) {
    const text = input.trim();
    if (!text) {
      notify("先写下你的目标、基础或资料");
      return;
    }

    setRecognizing(true);
    try {
      const response = await fetch("/api/recognize-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text })
      });
      if (!response.ok) throw new Error(await readApiError(response, "AI 识别暂不可用"));
      const data = (await response.json()) as RecognitionResult;
      setRecognition(data);
      setGoal(data.prompt);
      notify("已识别学习需求");
    } catch (error) {
      setRecognition({
        goal: text.length <= 28 ? text : "围绕你的描述规划学习路线",
        profile: "当前基础未明确，需要先识别前置知识并逐步推进。",
        constraints: ["路线需要从目标倒推，兼顾概念、练习和项目"],
        keywords: ["基础", "核心概念", "项目练习", "路线规划"],
        prompt: text
      });
      notify(`${error instanceof Error ? error.message : "AI 识别暂不可用"}，已使用本地规则`);
    } finally {
      setRecognizing(false);
    }
  }

  if (view === "map") {
    return withToasts(
      <MapPage
        route={route}
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
        setView={setView}
        onSave={() => saveRoute()}
        onNewRoute={newRoute}
        onAddNode={addNode}
        onUpdateNode={updateNode}
        onDeleteNode={deleteNode}
        onMoveNode={moveNode}
        onShare={shareCurrentRoute}
        onExport={exportRoute}
        mascotVariant={mascotVariant}
        onMascotVariantChange={updateMascotVariant}
      />
    );
  }

  if (view === "upload") {
    return withToasts(<UploadPage onGenerate={generateRoute} onImportRoute={importRoute} notify={notify} setView={setView} />);
  }

  if (view === "community") {
    return withToasts(
      <CommunityPage
        currentRoute={route}
        onGenerate={generateRoute}
        onLoadBuiltin={(builtinRoute) => { importRoute(builtinRoute); setView("map"); }}
        notify={notify}
        setView={setView}
      />
    );
  }

  if (view === "universe") {
    return withToasts(<UniversePage currentRoute={route} onOpenRoute={openRoute} onNewRoute={newRoute} notify={notify} setView={setView} />);
  }

  return withToasts(
    <LandingPage
      goal={goal}
      setGoal={setGoal}
      generating={generating}
      recognizing={recognizing}
      recognition={recognition}
      mascotVariant={mascotVariant}
      onMascotVariantChange={updateMascotVariant}
      onRecognize={recognizeRoute}
      onGenerate={generateRoute}
      onNewRoute={newRoute}
      setView={setView}
    />
  );
}
