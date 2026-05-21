export type Domain = "math" | "system" | "programming" | "frontend" | "backend" | "engineering" | "ai";
export type LearningStatus = "learned" | "learning" | "unlearned";
export type EdgeKind = "dependency" | "related";

export type KnowledgeNode = {
  id: string;
  title: string;
  domain: Domain;
  core: boolean;
  status: LearningStatus;
  position: { x: number; y: number };
  why: string;
  problems: string[];
  prerequisites: string[];
  path: string[];
  projects: string[];
  resources: string[];
};

export type KnowledgeEdge = {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
};

export type Route = {
  title: string;
  description: string;
  summary: string;
  domains: Record<Domain, string>;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
};

export const domainStyles: Record<Domain, { label: string; color: string; bg: string; border: string; subtle: string }> = {
  math: { label: "数学", color: "#2563eb", bg: "#f4f8ff", border: "#7da7ff", subtle: "#dfeaff" },
  system: { label: "系统", color: "#ef3b3b", bg: "#fff5f5", border: "#ff8a8a", subtle: "#ffe2e2" },
  programming: { label: "编程", color: "#5b3df5", bg: "#f7f4ff", border: "#9d8cff", subtle: "#ece7ff" },
  frontend: { label: "前端", color: "#16a34a", bg: "#f3fff7", border: "#7ed79b", subtle: "#def8e6" },
  backend: { label: "后端", color: "#ea8a00", bg: "#fff9ee", border: "#ffbd62", subtle: "#fff0cf" },
  engineering: { label: "工程化", color: "#2563eb", bg: "#f4f8ff", border: "#84aaff", subtle: "#e4edff" },
  ai: { label: "AI", color: "#8b5cf6", bg: "#f7f2ff", border: "#b49cff", subtle: "#eee6ff" }
};

export const defaultRoute: Route = {
  title: "全栈工程师路线",
  description: "从数学、编程基础、系统、前后端到工程化部署，建立完整的软件知识结构。",
  summary: "共 6 大领域，24 个核心知识点，覆盖从问题建模到真实交付的完整路径。",
  domains: {
    math: "理解抽象、逻辑和不确定性，是所有计算问题的语言。",
    system: "理解计算机如何管理资源，以及程序为什么能稳定运行。",
    programming: "把问题表达成数据结构、算法和可维护的软件结构。",
    frontend: "把系统能力变成用户可以理解和操作的界面。",
    backend: "处理业务规则、数据流转、服务边界与系统协作。",
    engineering: "让软件可以被部署、观测、迭代和长期维护。",
    ai: "理解模型如何从数据中学习，以及如何把 AI 接入产品。"
  },
  nodes: [
    {
      id: "discrete-math",
      title: "离散数学",
      domain: "math",
      core: false,
      status: "learned",
      position: { x: 80, y: 40 },
      why: "计算机处理的是离散符号、状态和关系。离散数学让人可以用集合、逻辑、图和证明去描述这些结构。",
      problems: ["如何严谨描述程序条件？", "如何理解图、树、关系和状态？", "如何证明算法一定正确？"],
      prerequisites: ["高中数学", "基础逻辑"],
      path: ["命题逻辑", "集合与关系", "图论", "证明方法"],
      projects: ["用图建模课程依赖关系", "写一个简单 SAT 表达式求值器"],
      resources: ["MIT Mathematics for Computer Science", "离散数学及其应用"]
    },
    {
      id: "data-structure",
      title: "数据结构",
      domain: "programming",
      core: true,
      status: "learned",
      position: { x: 360, y: 30 },
      why: "程序不是只处理数字，而是在组织现实世界的信息。数据结构被发明出来，是为了让数据以适合问题的形态被存取、查找和修改。",
      problems: ["如何快速查找数据？", "如何表达层级和网络关系？", "如何在空间和时间之间取舍？"],
      prerequisites: ["一门编程语言", "离散数学"],
      path: ["数组与链表", "栈与队列", "树与图", "哈希表"],
      projects: ["实现一个迷你数据库索引", "实现课程路线拓扑排序"],
      resources: ["CS61B", "Hello 算法", "算法导论相关章节"]
    },
    {
      id: "algorithm",
      title: "算法",
      domain: "programming",
      core: true,
      status: "learning",
      position: { x: 640, y: 40 },
      why: "算法是人类把解决问题的方法压缩成可重复执行步骤的方式。它关心的是在有限资源下如何得到可靠结果。",
      problems: ["同一个问题为什么有快慢差异？", "如何判断一个方案是否可扩展？", "如何把复杂问题拆成可计算子问题？"],
      prerequisites: ["数据结构", "离散数学"],
      path: ["复杂度", "排序搜索", "递归与动态规划", "图算法"],
      projects: ["路线依赖最短路径", "任务调度器"],
      resources: ["MIT 6.006", "LeetCode Top Interview", "算法图解"]
    },
    {
      id: "c-language",
      title: "C 语言",
      domain: "programming",
      core: false,
      status: "learned",
      position: { x: 130, y: 300 },
      why: "C 语言接近机器模型，让人看见内存、指针和编译后程序如何运行，是理解系统课程的入口。",
      problems: ["变量在内存里是什么？", "程序如何和硬件边界打交道？", "为什么需要手动管理资源？"],
      prerequisites: ["编程基础"],
      path: ["语法", "指针", "内存", "文件与编译"],
      projects: ["实现动态数组", "写一个简单 shell 命令解析器"],
      resources: ["CS50 C", "C Programming Language"]
    },
    {
      id: "computer-organization",
      title: "组成原理",
      domain: "system",
      core: false,
      status: "unlearned",
      position: { x: 80, y: 560 },
      why: "程序最终要落到 CPU、内存和 I/O 上执行。组成原理解释抽象代码如何变成机器可以执行的电信号和指令。",
      problems: ["CPU 如何执行一条指令？", "内存层级为什么存在？", "程序为什么会受硬件限制？"],
      prerequisites: ["C 语言", "数字逻辑"],
      path: ["数据表示", "指令系统", "CPU", "存储层级"],
      projects: ["实现一个迷你虚拟机", "观察程序汇编输出"],
      resources: ["Nand2Tetris", "CSAPP"]
    },
    {
      id: "operating-system",
      title: "操作系统",
      domain: "system",
      core: true,
      status: "learning",
      position: { x: 360, y: 520 },
      why: "早期计算机一次只能运行一个程序。随着程序变多，它们会争抢 CPU、内存和 I/O。操作系统被发明出来，是为了让多个程序公平、安全地共享一台机器。",
      problems: ["多个程序如何共享 CPU？", "不同程序的内存如何互不破坏？", "文件、进程、线程为什么需要统一抽象？"],
      prerequisites: ["C 语言", "数据结构", "组成原理"],
      path: ["进程与线程", "内存管理", "文件系统", "并发与同步"],
      projects: ["实现用户态线程池", "写一个简化版 shell", "实现 LRU 页面置换模拟器"],
      resources: ["OSTEP", "MIT 6.S081", "南京大学操作系统课程"]
    },
    {
      id: "network",
      title: "计算机网络",
      domain: "system",
      core: true,
      status: "unlearned",
      position: { x: 640, y: 520 },
      why: "单机程序只能解决局部问题。网络让不同机器协作，核心是在不可靠链路上建立可理解、可恢复的通信秩序。",
      problems: ["消息如何从一台机器到另一台机器？", "为什么需要分层协议？", "如何处理丢包、延迟和拥塞？"],
      prerequisites: ["操作系统", "数据结构"],
      path: ["TCP/IP", "HTTP", "DNS", "安全与 TLS"],
      projects: ["实现 HTTP 静态服务器", "写一个 TCP 聊天室"],
      resources: ["Computer Networking: A Top-Down Approach", "CS144"]
    },
    {
      id: "database",
      title: "数据库",
      domain: "backend",
      core: true,
      status: "unlearned",
      position: { x: 930, y: 360 },
      why: "当数据比内存更大、比单次请求更长寿时，人类需要一种可靠保存、查询和并发修改事实的系统，这就是数据库。",
      problems: ["数据如何长期可靠保存？", "多人同时修改时如何保持一致？", "为什么索引能让查询变快？"],
      prerequisites: ["数据结构", "操作系统"],
      path: ["关系模型", "SQL", "索引", "事务"],
      projects: ["设计课程路线数据库", "实现 KV Store"],
      resources: ["CMU 15-445", "SQLBolt", "Designing Data-Intensive Applications"]
    },
    {
      id: "backend",
      title: "后端开发",
      domain: "backend",
      core: true,
      status: "learning",
      position: { x: 930, y: 610 },
      why: "前端表达用户意图，后端负责把意图转成可验证、可持久、可协作的业务行为。",
      problems: ["请求如何变成业务动作？", "服务之间如何划分边界？", "如何处理认证、权限和错误？"],
      prerequisites: ["网络", "数据库", "一门后端语言"],
      path: ["API 设计", "认证授权", "缓存", "消息队列"],
      projects: ["知识地图 API", "路线 Fork 服务"],
      resources: ["Node.js 官方文档", "FastAPI 文档", "RESTful API Design"]
    },
    {
      id: "html-css",
      title: "HTML / CSS",
      domain: "frontend",
      core: false,
      status: "learned",
      position: { x: 1210, y: 80 },
      why: "Web 需要一种表达内容结构和视觉规则的方式。HTML 和 CSS 把信息与呈现分开，让同一份内容能被浏览器理解和排版。",
      problems: ["内容结构如何被浏览器理解？", "布局为什么会响应不同屏幕？", "如何让界面保持可访问？"],
      prerequisites: ["基础计算机使用"],
      path: ["语义标签", "盒模型", "Flex/Grid", "响应式"],
      projects: ["复刻猫扑首页", "制作知识节点卡片系统"],
      resources: ["MDN", "web.dev"]
    },
    {
      id: "javascript",
      title: "JavaScript",
      domain: "frontend",
      core: false,
      status: "learned",
      position: { x: 1210, y: 300 },
      why: "网页一开始主要是文档。JavaScript 被发明出来，是为了让页面响应用户操作，逐渐演化成构建复杂应用的语言。",
      problems: ["用户操作如何改变界面？", "异步请求为什么存在？", "状态变化如何驱动 UI？"],
      prerequisites: ["HTML / CSS", "编程基础"],
      path: ["语法", "DOM", "异步", "模块化"],
      projects: ["交互式路线卡片", "本地状态知识地图"],
      resources: ["JavaScript.info", "MDN JavaScript"]
    },
    {
      id: "react",
      title: "React",
      domain: "frontend",
      core: true,
      status: "learning",
      position: { x: 1210, y: 520 },
      why: "当界面状态越来越复杂，直接操作 DOM 会让逻辑难以维护。React 用组件和状态把 UI 变成可组合的函数结果。",
      problems: ["复杂 UI 如何拆分？", "状态变化如何稳定更新界面？", "组件之间如何协作？"],
      prerequisites: ["JavaScript", "HTML / CSS"],
      path: ["组件", "状态", "副作用", "数据流"],
      projects: ["猫扑地图节点组件", "课程详情抽屉"],
      resources: ["React Docs", "Next.js Learn"]
    },
    {
      id: "linux",
      title: "Linux",
      domain: "engineering",
      core: false,
      status: "unlearned",
      position: { x: 1500, y: 260 },
      why: "大多数服务器运行在类 Unix 环境中。Linux 让工程师理解文件、进程、权限和命令行如何支撑线上系统。",
      problems: ["服务运行在哪里？", "日志、权限和进程如何管理？", "为什么部署离不开命令行？"],
      prerequisites: ["操作系统"],
      path: ["Shell", "文件权限", "进程", "日志"],
      projects: ["部署静态站点", "编写备份脚本"],
      resources: ["Linux Journey", "The Linux Command Line"]
    },
    {
      id: "docker",
      title: "Docker",
      domain: "engineering",
      core: true,
      status: "unlearned",
      position: { x: 1500, y: 500 },
      why: "软件经常在不同机器上表现不一致。Docker 用容器把运行环境一起打包，让部署从“配置机器”变成“运行镜像”。",
      problems: ["为什么我电脑能跑线上不能跑？", "如何隔离依赖？", "服务如何被复制和迁移？"],
      prerequisites: ["Linux", "网络", "后端开发"],
      path: ["镜像", "容器", "Dockerfile", "Compose"],
      projects: ["容器化猫扑后端", "部署数据库与 API"],
      resources: ["Docker Docs", "Play with Docker"]
    }
  ],
  edges: [
    { id: "e1", source: "discrete-math", target: "data-structure", kind: "dependency" },
    { id: "e2", source: "data-structure", target: "algorithm", kind: "dependency" },
    { id: "e3", source: "c-language", target: "computer-organization", kind: "dependency" },
    { id: "e4", source: "computer-organization", target: "operating-system", kind: "dependency" },
    { id: "e5", source: "data-structure", target: "operating-system", kind: "dependency" },
    { id: "e6", source: "operating-system", target: "network", kind: "dependency" },
    { id: "e7", source: "data-structure", target: "database", kind: "dependency" },
    { id: "e8", source: "operating-system", target: "database", kind: "related" },
    { id: "e9", source: "network", target: "backend", kind: "dependency" },
    { id: "e10", source: "database", target: "backend", kind: "dependency" },
    { id: "e11", source: "html-css", target: "javascript", kind: "dependency" },
    { id: "e12", source: "javascript", target: "react", kind: "dependency" },
    { id: "e13", source: "network", target: "linux", kind: "related" },
    { id: "e14", source: "linux", target: "docker", kind: "dependency" },
    { id: "e15", source: "backend", target: "docker", kind: "dependency" },
    { id: "e16", source: "network", target: "docker", kind: "related" }
  ]
};

export function routeForGoal(goal: string): Route {
  const normalizedGoal = goal.trim() || "我想成为全栈工程师";
  return {
    ...defaultRoute,
    title: normalizedGoal.includes("AI") || normalizedGoal.includes("人工智能") ? "AI 工程师路线" : "全栈工程师路线",
    description: `根据「${normalizedGoal}」生成的知识地图，优先展示知识之间的依赖关系和每门课存在的原因。`
  };
}
