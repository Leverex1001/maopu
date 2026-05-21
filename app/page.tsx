"use client";

import "@xyflow/react/dist/style.css";

import { AnimatePresence, motion } from "framer-motion";
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
  Layers3,
  Library,
  Map as MapIcon,
  MessageCircle,
  Network,
  PanelRightOpen,
  Pencil,
  Plus,
  Search,
  Settings,
  Share2,
  Sparkles,
  Trash2,
  UploadCloud,
  X
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  defaultRoute,
  Domain,
  domainStyles,
  KnowledgeNode,
  LearningStatus,
  routeForGoal,
  Route as MaopuRoute
} from "@/lib/route-data";

type View = "landing" | "map" | "upload" | "community" | "universe";

type Toast = {
  id: number;
  message: string;
};

const STORAGE_KEY = "maopu.savedRoutes.v1";

const routeCards = [
  { title: "MIT 计算机科学路线", author: "MIT OpenCourseWare", rating: "4.8", learners: "12.4k" },
  { title: "OpenAI 工程师路线", author: "OpenAI Cookbook", rating: "4.9", learners: "8.7k" },
  { title: "独立游戏开发路线", author: "Indie Game Dev", rating: "4.6", learners: "5.2k" },
  { title: "AI 科研路线", author: "Papers + Lab", rating: "4.8", learners: "9.1k" }
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

function cloneRoute(route: MaopuRoute): MaopuRoute {
  return JSON.parse(JSON.stringify(route)) as MaopuRoute;
}

function routeStorageId(route: MaopuRoute) {
  return `${route.title}-${route.nodes.length}-${route.edges.length}`;
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
    <div className="flex items-center gap-3 font-black text-3xl">
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
      className={`rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 px-7 py-4 font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-panel ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function OutlineButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded-xl border border-brand-500 bg-white px-6 py-3 font-bold text-brand-500 transition hover:bg-brand-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function LandingPage({
  goal,
  setGoal,
  generating,
  onGenerate,
  setView
}: {
  goal: string;
  setGoal: (goal: string) => void;
  generating: boolean;
  onGenerate: (goal: string) => void;
  setView: (view: View) => void;
}) {
  const examples = ["全栈工程师", "人工智能工程师", "数据科学家", "游戏开发者", "考研计算机"];

  function submit(event: FormEvent) {
    event.preventDefault();
    onGenerate(goal);
  }

  return (
    <main className="min-h-screen px-6 py-7 lg:px-16">
      <header className="mx-auto flex max-w-[1440px] items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-9 text-lg font-bold lg:flex">
          <button onClick={() => setView("community")} className="hover:text-brand-500">
            探索路线
          </button>
          <button onClick={() => setView("community")} className="hover:text-brand-500">
            社区
          </button>
          <button onClick={() => setView("universe")} className="hover:text-brand-500">
            我的学习
          </button>
          <Search className="h-7 w-7" />
          <CircleUserRound className="h-10 w-10 text-brand-500" />
        </nav>
      </header>

      <section className="mx-auto grid max-w-[1440px] items-center gap-10 pb-12 pt-20 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-2 font-bold text-brand-500 shadow-soft">
            <Sparkles className="h-5 w-5" />
            知识结构可视化工具
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-normal lg:text-7xl">学习之前，先看见地图。</h1>
          <p className="mt-6 max-w-2xl text-xl leading-9 text-muted">
            用 AI 生成完整的学习路径，从第一性原理理解一门学科为什么存在，以及知识之间如何连接。
          </p>

          <form onSubmit={submit} className="mt-10 rounded-3xl border border-brand-100 bg-white p-4 shadow-soft">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <label className="sr-only" htmlFor="goal">
                学习目标
              </label>
              <input
                id="goal"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                className="min-h-16 flex-1 rounded-2xl border border-transparent px-5 text-xl font-semibold outline-none focus:border-brand-100"
                placeholder="我想成为一名全栈工程师"
              />
              <PrimaryButton type="submit" className="min-w-52">
                {generating ? "正在生成..." : "生成知识地图"}
              </PrimaryButton>
            </div>
          </form>

          <div className="mt-7 flex flex-wrap gap-3">
            {examples.map((example) => (
              <button
                key={example}
                onClick={() => setGoal(`我想成为一名${example}`)}
                className="rounded-xl border border-line bg-white px-5 py-3 font-bold text-ink transition hover:border-brand-500 hover:text-brand-500"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="relative min-h-[520px] overflow-hidden rounded-[2rem]">
          <div className="mascot-crop absolute inset-0 rounded-[2rem]" />
          <div className="absolute bottom-8 left-8 rounded-2xl border border-brand-100 bg-white/86 p-5 shadow-soft backdrop-blur">
            <p className="text-sm font-bold text-muted">示例路线</p>
            <p className="mt-1 text-2xl font-black">全栈工程师知识地图</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-black">热门公开路线</h2>
          <button onClick={() => setView("community")} className="font-bold text-brand-500">
            查看全部 <ChevronRight className="inline h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-5 lg:grid-cols-4">
          {routeCards.map((card) => (
            <button
              key={card.title}
              onClick={() => onGenerate(card.title)}
              className="min-h-64 rounded-2xl border border-line bg-white p-7 text-left shadow-soft transition hover:-translate-y-1 hover:border-brand-500"
            >
              <h3 className="text-2xl font-black">{card.title}</h3>
              <p className="mt-14 text-lg text-muted">{card.author}</p>
              <p className="mt-8 flex items-center gap-5 text-lg">
                <span className="text-amber-500">★ {card.rating}</span>
                <span className="text-muted">{card.learners} 人学习</span>
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-5 pb-16 lg:grid-cols-3">
        {["为什么会有操作系统？", "为什么会有数据库？", "为什么会有微积分？"].map((question) => (
          <div key={question} className="rounded-2xl border border-line bg-white p-7 shadow-soft">
            <BookOpen className="mb-6 h-8 w-8 text-brand-500" />
            <h3 className="text-2xl font-black">{question}</h3>
            <p className="mt-4 leading-7 text-muted">猫扑从问题和历史出发，帮你先理解知识存在的理由，再进入细节学习。</p>
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
      <MiniMap
        pannable
        zoomable
        position="top-left"
        className="!left-5 !top-5 !h-36 !w-56 overflow-hidden !rounded-2xl !border !border-line !bg-white/90 !shadow-soft"
        nodeColor={(node) => domainStyles[(node.data as KnowledgeNode).domain].border}
      />
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

  useEffect(() => {
    setDraft(node);
    setEditing(false);
  }, [node]);

  function updateDraft(partial: Partial<KnowledgeNode>) {
    setDraft((current) => (current ? { ...current, ...partial } : current));
  }

  function saveDraft() {
    if (!draft) return;
    onUpdate(draft);
    setEditing(false);
  }

  return (
    <AnimatePresence>
      {node && draft && (
        <motion.aside
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 240 }}
          className="absolute bottom-5 right-5 top-5 z-20 flex w-[420px] flex-col rounded-3xl border border-line bg-white shadow-panel"
        >
          <div className="flex items-start justify-between border-b border-line p-7">
            <div>
              <p className="mb-3 text-sm font-bold text-muted">{domainStyles[node.domain].label}</p>
              <h2 className="text-4xl font-black">{editing ? "编辑节点" : node.title}</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing((value) => !value)}
                className="rounded-xl border border-line p-3 text-muted hover:text-brand-500"
                title="编辑节点"
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
                  <PrimaryButton onClick={saveDraft} className="py-3">
                    保存节点
                  </PrimaryButton>
                  <OutlineButton onClick={() => setDraft(node)} className="py-3">
                    重置
                  </OutlineButton>
                </div>
                <button
                  onClick={() => onDelete(node.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-black text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                  删除节点
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

function Assistant({ selectedNode }: { selectedNode: KnowledgeNode | null }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"next" | "explain" | "resource">("next");
  const target = selectedNode?.title ?? "操作系统";
  const message =
    mode === "explain"
      ? selectedNode?.why ?? "操作系统被发明出来，是为了让多个程序公平、安全地共享一台机器。"
      : mode === "resource"
        ? `推荐先看：${(selectedNode?.resources ?? ["OSTEP", "MIT 6.S081"]).join("、")}。`
        : `下一站建议：如果你已经理解数据结构，优先学习${target}；先抓住它解决的核心问题，再进入细节。`;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-2xl border border-brand-100 bg-white p-3 pr-5 shadow-panel transition hover:-translate-y-1"
      >
        <span className="mascot-assistant block h-16 w-16 rounded-full border border-brand-100 bg-brand-50" />
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
            className="fixed bottom-28 right-6 z-50 w-[390px] rounded-3xl border border-line bg-white p-6 shadow-panel"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="mascot-assistant block h-16 w-16 rounded-full border border-brand-100 bg-brand-50" />
                <div>
                  <h3 className="text-2xl font-black">小扑</h3>
                  <p className="font-semibold text-muted">安静的知识导航员</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-xl border border-line p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-violet-500 p-5 text-lg font-bold leading-8 text-white">
              你现在正在看：{target}。我会先帮你理解它为什么存在，再推荐下一步。
            </div>
            <div className="mt-4 rounded-2xl border border-line p-5 font-semibold leading-7 text-ink">{message}</div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <OutlineButton onClick={() => setMode("explain")} className="px-3 py-3">
                解释概念
              </OutlineButton>
              <OutlineButton onClick={() => setMode("resource")} className="px-3 py-3">
                推荐资源
              </OutlineButton>
            </div>
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
  onExport
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
  onExport: (kind: "markdown" | "json" | "svg") => void;
}) {
  const learned = route.nodes.filter((node) => node.status === "learned").length;
  const learning = route.nodes.filter((node) => node.status === "learning").length;
  const [search, setSearch] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  function findNode() {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return;
    const match = route.nodes.find((node) => node.title.toLowerCase().includes(keyword));
    if (match) setSelectedNode(match);
  }

  return (
    <main className="h-screen overflow-hidden bg-white">
      <header className="flex h-20 items-center justify-between border-b border-line px-7">
        <div className="flex items-center gap-7">
          <Logo />
          <div className="hidden items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 font-bold text-muted lg:flex">
            <Search className="h-5 w-5 text-brand-500" />
            我的路线 <ChevronRight className="h-4 w-4" /> {route.title}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 font-bold text-muted lg:flex">
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
          <OutlineButton onClick={onSave} className="hidden items-center gap-2 lg:flex">
            <CheckCircle2 className="h-5 w-5" />
            保存
          </OutlineButton>
          <OutlineButton onClick={onAddNode} className="hidden items-center gap-2 lg:flex">
            <Plus className="h-5 w-5" />
            节点
          </OutlineButton>
          <OutlineButton onClick={() => setView("upload")} className="hidden lg:block">
            导入路线
          </OutlineButton>
          <div className="relative hidden lg:block">
            <OutlineButton onClick={() => setExportOpen((value) => !value)} className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              导出
            </OutlineButton>
            {exportOpen && (
              <div className="absolute right-0 top-14 z-30 w-44 rounded-2xl border border-line bg-white p-2 shadow-panel">
                {[
                  ["markdown", "Markdown"],
                  ["json", "JSON"],
                  ["svg", "SVG 地图"]
                ].map(([kind, label]) => (
                  <button
                    key={kind}
                    onClick={() => {
                      onExport(kind as "markdown" | "json" | "svg");
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
          <button onClick={() => setView("universe")} className="rounded-xl border border-line p-3">
            <CircleUserRound className="h-6 w-6 text-brand-500" />
          </button>
        </div>
      </header>

      <div className="grid h-[calc(100vh-80px)] grid-cols-[96px_1fr]">
        <aside className="flex flex-col items-center gap-4 border-r border-line bg-white px-3 py-6">
          {[
            { icon: MapIcon, label: "地图", view: "map" as View, active: true },
            { icon: Network, label: "路线", view: "community" as View },
            { icon: UploadCloud, label: "导入", view: "upload" as View },
            { icon: CircleUserRound, label: "我的", view: "universe" as View },
            { icon: Settings, label: "新建", view: "map" as View }
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => (item.label === "新建" ? onNewRoute() : setView(item.view))}
              className={`flex w-full flex-col items-center gap-2 rounded-2xl py-4 text-sm font-black ${
                item.active ? "bg-brand-50 text-brand-500" : "text-muted hover:bg-brand-50"
              }`}
            >
              <item.icon className="h-6 w-6" />
              {item.label}
            </button>
          ))}
        </aside>

        <section className="relative">
          <div className="absolute left-6 top-6 z-10 rounded-3xl border border-line bg-white/92 p-5 shadow-soft backdrop-blur">
            <h1 className="text-3xl font-black">{route.title}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{route.description}</p>
            <div className="mt-4 flex gap-3 text-sm font-bold">
              <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700">{learned} 已点亮</span>
              <span className="rounded-full bg-amber-50 px-3 py-2 text-amber-700">{learning} 学习中</span>
              <span className="rounded-full bg-brand-50 px-3 py-2 text-brand-500">{route.nodes.length} 节点</span>
            </div>
          </div>
          <ReactFlowProvider>
            <MapCanvas route={route} selectedNodeId={selectedNode?.id ?? null} onSelect={setSelectedNode} onMoveNode={onMoveNode} />
          </ReactFlowProvider>
          <CoursePanel node={selectedNode} onClose={() => setSelectedNode(null)} onUpdate={onUpdateNode} onDelete={onDeleteNode} />
          <Assistant selectedNode={selectedNode} />
        </section>
      </div>
    </main>
  );
}

function UploadPage({ onGenerate, setView }: { onGenerate: (goal: string) => void; setView: (view: View) => void }) {
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);

  function simulateUpload() {
    setFileName("培养计划.pdf");
    setParsing(true);
    window.setTimeout(() => {
      setParsing(false);
      onGenerate("根据培养计划生成 CS 知识地图");
    }, 900);
  }

  return (
    <Shell title="上传解析中心" setView={setView}>
      <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-12 lg:grid-cols-[1.45fr_.85fr]">
        <button
          onClick={simulateUpload}
          className="grid min-h-[560px] place-items-center rounded-3xl border-2 border-dashed border-brand-100 bg-white text-center shadow-soft transition hover:border-brand-500"
        >
          <div>
            <span className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-brand-50 text-brand-500">
              <UploadCloud className="h-14 w-14" />
            </span>
            <h2 className="mt-8 text-4xl font-black">拖拽文件到此处，或点击上传</h2>
            <p className="mt-5 text-xl text-muted">支持 PDF / Excel / Markdown / GitHub 链接</p>
            <PrimaryButton className="mt-10">{parsing ? "正在解析..." : fileName || "选择文件"}</PrimaryButton>
          </div>
        </button>
        <div className="rounded-3xl border border-line bg-white p-10 shadow-soft">
          <h2 className="text-3xl font-black">支持的格式</h2>
          {[
            [FileText, "PDF 培养计划", "学位课程规、培养方案等"],
            [Layers3, "Excel 表格", "课程清单、学习计划等"],
            [Code2, "Markdown 文件", "自定义 roadmap 文件"],
            [GitFork, "GitHub 链接", "开源学习路线仓库"]
          ].map(([Icon, title, desc]) => (
            <div key={String(title)} className="mt-10 flex gap-5">
              <Icon className="h-10 w-10 text-ink" />
              <div>
                <h3 className="text-2xl font-black">{String(title)}</h3>
                <p className="mt-2 text-xl text-muted">{String(desc)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function CommunityPage({ onGenerate, setView }: { onGenerate: (goal: string) => void; setView: (view: View) => void }) {
  return (
    <Shell title="路线社区" setView={setView}>
      <div className="mx-auto max-w-[1440px] px-6 py-12">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-5">
          <div className="flex flex-wrap gap-4 text-xl font-bold">
            {["热门", "最新", "考研", "就业", "AI", "游戏开发", "更多"].map((tab, index) => (
              <button key={tab} className={`rounded-2xl px-7 py-4 ${index === 0 ? "bg-brand-50 text-brand-500" : "text-muted"}`}>
                {tab}
              </button>
            ))}
          </div>
          <PrimaryButton onClick={() => setView("upload")}>创建路线</PrimaryButton>
        </div>
        <div className="grid gap-6 lg:grid-cols-4">
          {routeCards.map((card) => (
            <article key={card.title} className="flex min-h-[520px] flex-col justify-between rounded-3xl border border-line bg-white p-8 shadow-soft">
              <div>
                <h2 className="text-3xl font-black leading-tight">{card.title}</h2>
                <p className="mt-24 text-xl text-muted">{card.author}</p>
                <p className="mt-10 flex items-center gap-5 text-xl">
                  <span className="text-amber-500">★ {card.rating}</span>
                  <span className="text-muted">{card.learners} 人学习</span>
                </p>
              </div>
              <div className="grid gap-3">
                <OutlineButton onClick={() => onGenerate(card.title)}>查看路线</OutlineButton>
                <div className="flex justify-between text-muted">
                  <Heart className="h-6 w-6" />
                  <GitFork className="h-6 w-6" />
                  <Share2 className="h-6 w-6" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function UniversePage({ setView }: { setView: (view: View) => void }) {
  return (
    <Shell title="我的学习" setView={setView}>
      <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-6 py-12 lg:grid-cols-[1fr_360px_1fr]">
        <div className="rounded-3xl border border-line bg-white p-9 shadow-soft">
          <h2 className="text-3xl font-black">我的路线</h2>
          {[
            ["全栈工程师路线", "学习中", "32%", "bg-amber-100 text-amber-600"],
            ["算法与数据结构", "学习中", "45%", "bg-pink-100 text-pink-600"],
            ["AI 基础知识", "未开始", "0%", "bg-emerald-100 text-emerald-600"]
          ].map(([title, status, progress, color]) => (
            <div key={title} className="flex items-center gap-5 border-b border-line py-8">
              <span className={`grid h-16 w-16 place-items-center rounded-2xl ${color}`}>
                <Boxes className="h-8 w-8" />
              </span>
              <div className="flex-1">
                <h3 className="text-2xl font-black">{title}</h3>
                <p className="mt-2 text-lg text-muted">{status}</p>
              </div>
              <span className="font-bold text-brand-500">{progress}</span>
              <ChevronRight className="h-6 w-6 text-muted" />
            </div>
          ))}
          <button onClick={() => setView("community")} className="mt-8 font-black text-brand-500">
            查看全部路线 <ChevronRight className="inline h-5 w-5" />
          </button>
        </div>
        <div className="mascot-full min-h-[620px] rounded-[2rem]" />
        <div className="rounded-3xl border border-line bg-white p-9 shadow-soft">
          <h2 className="text-3xl font-black">学习概览</h2>
          <div className="mt-9 grid grid-cols-3 gap-4 border-b border-line pb-9 text-center text-muted">
            {[
              ["已学知识点", "48"],
              ["学习时长", "126"],
              ["完成项目", "6"]
            ].map(([label, value]) => (
              <div key={label}>
                <p className="font-semibold">{label}</p>
                <strong className="mt-3 block text-5xl text-ink">{value}</strong>
              </div>
            ))}
          </div>
          <h3 className="mt-10 text-2xl font-black">最近学习</h3>
          {["离散数学", "数据结构与算法", "计算机组成原理"].map((item, index) => (
            <div key={item} className="mt-7 flex items-center justify-between text-xl text-muted">
              <span className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-brand-500" />
                {item}
              </span>
              <span>{index === 0 ? "2小时前" : index === 1 ? "昨天" : "2天前"}</span>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ title, children, setView }: { title: string; children: React.ReactNode; setView: (view: View) => void }) {
  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-line bg-white px-7 py-5">
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
      <div className="mx-auto max-w-[1440px] px-6 pt-10">
        <h1 className="text-5xl font-black">{title}</h1>
      </div>
      {children}
    </main>
  );
}

export default function HomePage() {
  const [view, setView] = useState<View>("landing");
  const [goal, setGoal] = useState("我想成为一名全栈工程师");
  const [route, setRoute] = useState<MaopuRoute>(defaultRoute);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [generating, setGenerating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const routes = JSON.parse(saved) as MaopuRoute[];
      if (routes[0]) setRoute(routes[0]);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  function notify(message: string) {
    const id = Date.now();
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2400);
  }

  function saveRoute(nextRoute = route) {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const routes = saved ? (JSON.parse(saved) as MaopuRoute[]) : [];
    const nextId = routeStorageId(nextRoute);
    const withoutCurrent = routes.filter((item) => routeStorageId(item) !== nextId && item.title !== nextRoute.title);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([nextRoute, ...withoutCurrent].slice(0, 12)));
    notify("路线已保存到本地");
  }

  function newRoute() {
    const next = cloneRoute(defaultRoute);
    next.title = "未命名知识路线";
    next.description = "从这里开始设计一条新的知识地图。";
    next.nodes = [];
    next.edges = [];
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([nextRoute]));
  }

  function exportRoute(kind: "markdown" | "json" | "svg") {
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
    setGoal(nextGoal);
    setGenerating(true);
    setSelectedNode(null);

    try {
      const response = await fetch("/api/generate-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: nextGoal })
      });
      if (!response.ok) throw new Error("Route generation failed");
      const data = (await response.json()) as MaopuRoute;
      setRoute(data);
      saveRoute(data);
    } catch {
      const fallback = routeForGoal(nextGoal);
      setRoute(fallback);
      saveRoute(fallback);
    } finally {
      window.setTimeout(() => {
        setGenerating(false);
        setView("map");
      }, 260);
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
        onExport={exportRoute}
      />
    );
  }

  if (view === "upload") {
    return withToasts(<UploadPage onGenerate={generateRoute} setView={setView} />);
  }

  if (view === "community") {
    return withToasts(<CommunityPage onGenerate={generateRoute} setView={setView} />);
  }

  if (view === "universe") {
    return withToasts(<UniversePage setView={setView} />);
  }

  return withToasts(<LandingPage goal={goal} setGoal={setGoal} generating={generating} onGenerate={generateRoute} setView={setView} />);
}
