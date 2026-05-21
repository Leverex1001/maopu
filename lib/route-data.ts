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
  math:        { label: "数学",  color: "#2563eb", bg: "#f4f8ff", border: "#7da7ff", subtle: "#dfeaff" },
  system:      { label: "系统",  color: "#ef3b3b", bg: "#fff5f5", border: "#ff8a8a", subtle: "#ffe2e2" },
  programming: { label: "编程",  color: "#5b3df5", bg: "#f7f4ff", border: "#9d8cff", subtle: "#ece7ff" },
  frontend:    { label: "前端",  color: "#16a34a", bg: "#f3fff7", border: "#7ed79b", subtle: "#def8e6" },
  backend:     { label: "后端",  color: "#ea8a00", bg: "#fff9ee", border: "#ffbd62", subtle: "#fff0cf" },
  engineering: { label: "工程化",color: "#2563eb", bg: "#f4f8ff", border: "#84aaff", subtle: "#e4edff" },
  ai:          { label: "AI",    color: "#8b5cf6", bg: "#f7f2ff", border: "#b49cff", subtle: "#eee6ff" }
};

// ─────────────────────────────────────────────
// 路线一：全栈工程师路线（默认路线，内容升级）
// ─────────────────────────────────────────────
export const defaultRoute: Route = {
  title: "全栈工程师路线",
  description: "从数学、编程基础、计算机系统到前后端与工程化，建立完整的软件知识结构。宁缺毋滥，每个节点只收录真正值得花时间的内容。",
  summary: "共 6 大领域，13 个核心知识点，覆盖从问题建模到真实交付的完整路径。",
  domains: {
    math:        "理解抽象、逻辑和不确定性，是所有计算问题的语言。",
    system:      "理解计算机如何管理资源，以及程序为什么能稳定运行。",
    programming: "把问题表达成数据结构、算法和可维护的软件结构。",
    frontend:    "把系统能力变成用户可以理解和操作的界面。",
    backend:     "处理业务规则、数据流转、服务边界与系统协作。",
    engineering: "让软件可以被部署、观测、迭代和长期维护。",
    ai:          "理解模型如何从数据中学习，以及如何把 AI 接入产品。"
  },
  nodes: [
    {
      id: "missing-semester",
      title: "MIT Missing Semester",
      domain: "engineering",
      core: false,
      status: "unlearned",
      position: { x: 80, y: 40 },
      why: "大学 CS 课程教你如何写编译器、操作系统，却鲜少教你如何高效使用工具本身。Shell、Git、Vim、调试器、性能分析——这些是每天都在用的基础设施，却往往靠自己摸索。Missing Semester 补上这个空缺：磨刀不误砍柴工。",
      problems: [
        "每次改错了代码不知道如何回退？",
        "重复性命令行操作浪费大量时间？",
        "调试只会 print？不会用 gdb/lldb？",
        "不知道如何用脚本自动化日常任务？"
      ],
      prerequisites: ["基础计算机操作"],
      path: [
        "Shell 与脚本（bash/zsh）",
        "Vim 基本操作（尽早形成肌肉记忆）",
        "Git 版本控制：commit、branch、rebase、merge",
        "命令行调试工具：gdb、pdb、strace",
        "数据处理：grep、awk、sed、jq",
        "性能分析：flamegraph、perf 概念"
      ],
      projects: [
        "写一个自动备份脚本，定时压缩并上传到远端",
        "配置 dotfiles 仓库，让新机器 10 分钟内完成环境搭建"
      ],
      resources: [
        "MIT Missing Semester 官网（https://missing.csail.mit.edu/）—— 课程视频+讲义全部免费",
        "《命令行的艺术》（GitHub jlevy/the-art-of-command-line，中文版，10 万 stars）",
        "Pro Git（https://git-scm.com/book/zh/v2）—— Git 官方中文书，免费在线阅读"
      ]
    },
    {
      id: "discrete-math",
      title: "离散数学与概率论",
      domain: "math",
      core: false,
      status: "unlearned",
      position: { x: 80, y: 280 },
      why: "计算机操作的是离散符号和状态，而不是连续量。离散数学提供了描述集合、关系、图和逻辑的语言；概率论则是在不确定性中做判断的基础——从算法分析到机器学习，背后都是这套工具。没有它，你只能记忆结论，无法推导。",
      problems: [
        "如何严格描述「一个程序在任何输入下都正确」？",
        "哈希碰撞的概率怎么估算？",
        "图的最短路径算法为什么一定能找到最优解？",
        "为什么随机算法有时比确定性算法更快？"
      ],
      prerequisites: ["高中数学（集合、函数、排列组合）"],
      path: [
        "命题逻辑与谓词逻辑（证明程序正确性的语言）",
        "集合论与关系（数据库关系模型的数学基础）",
        "图论：有向图、无向图、DFS/BFS、拓扑排序",
        "数学归纳法与递归（算法证明的核心工具）",
        "概率基础：条件概率、期望、方差",
        "随机变量与分布（为机器学习打基础）"
      ],
      projects: [
        "用图建模课程依赖关系，输出合法修课顺序（拓扑排序）",
        "实现一个简单的 SAT 求解器（布尔可满足性问题）",
        "模拟生日悖论：写代码验证 23 人中两人同生日的概率"
      ],
      resources: [
        "UCB CS70: Discrete Math and Probability（课程主页免费，讲义质量极高，兼顾理论与算法实例）",
        "MIT 6.042J: Mathematics for Computer Science（OCW 免费，面向 CS 专门设计）",
        "《离散数学及其应用》第 8 版（Rosen，国内高校主流教材，中文版易找）"
      ]
    },
    {
      id: "data-structure",
      title: "数据结构与算法",
      domain: "programming",
      core: true,
      status: "unlearned",
      position: { x: 400, y: 160 },
      why: "程序不是只处理数字，而是在组织现实世界的信息。数据结构是答案：每种结构都是对某类访问模式的最优适配——哈希表为 O(1) 查找而生，树为层级关系而生，图为网络关系而生。算法则是：同样的目标，不同路径的代价差异可以是指数级的。这是所有后续课程的基础，也是面试的核心。",
      problems: [
        "为什么数据库用 B+ 树做索引，而不用哈希表？",
        "动态规划和递归的本质区别是什么？",
        "Dijkstra 为什么不能处理负权边？",
        "红黑树为什么比 AVL 树更常用于工程？"
      ],
      prerequisites: ["一门编程语言（Java/Python/C++ 均可）", "离散数学基础"],
      path: [
        "数组、链表、栈、队列（理解内存模型）",
        "树：二叉树、BST、堆、Trie",
        "哈希表：设计、冲突处理、负载因子",
        "图：DFS/BFS、最短路（Dijkstra/Bellman-Ford）、最小生成树",
        "排序：归并、快排、堆排，及其时间空间复杂度",
        "动态规划：从记忆化搜索到状态转移方程",
        "复杂度分析：大 O 记号、均摊分析"
      ],
      projects: [
        "实现一个支持 LRU 淘汰策略的简易缓存（用哈希表 + 双向链表）",
        "用 Dijkstra 实现地图最短路径，可视化路径规划",
        "实现一个简单的命令行文本搜索工具（Trie 树前缀匹配）"
      ],
      resources: [
        "UCB CS61B: Data Structures（Josh Hug 主讲，项目量大质高，Java，强烈推荐）",
        "Princeton Algorithms I & II（Coursera，Robert Sedgewick，Java，配套书《算法》第4版）",
        "《Hello 算法》（https://www.hello-algo.com/，中文，图解丰富，免费在线阅读）",
        "MIT 6.006: Introduction to Algorithms（面向 Python，OCW 免费）"
      ]
    },
    {
      id: "csapp",
      title: "计算机系统基础（CSAPP）",
      domain: "system",
      core: true,
      status: "unlearned",
      position: { x: 400, y: 440 },
      why: "你写的每一行代码，最终都要在 CPU、内存和操作系统上跑。CSAPP（《深入理解计算机系统》）是回答「为什么」的书：为什么浮点数会精度丢失？为什么缓存命中率影响性能？为什么内存泄露会让程序崩溃？不理解这些，你只能靠猜来调 bug。它连接了编程语言和底层硬件，是 C/系统/OS/网络课程的最佳前导。",
      problems: [
        "为什么 0.1 + 0.2 ≠ 0.3？",
        "编译器把 C 代码变成什么？汇编怎么看？",
        "程序的栈、堆、代码段分别放在哪？",
        "为什么数组越界会导致随机崩溃，而不是立刻报错？",
        "性能瓶颈在 CPU？内存？I/O？怎么判断？"
      ],
      prerequisites: ["C 语言基础", "数据结构"],
      path: [
        "数据表示：整数、浮点、字节序",
        "程序的机器级表示：汇编、寻址、控制流",
        "链接器：符号解析、重定位、动态库",
        "内存层次：缓存、局部性原理、虚拟内存",
        "异常控制流：信号、进程、setjmp",
        "并发：线程、锁、竞态条件"
      ],
      projects: [
        "CSAPP 官方 Lab：Data Lab（位运算）、Bomb Lab（逆向汇编拆炸弹）、Malloc Lab（手写内存分配器）",
        "用 C 实现一个带缓存的文件读取库，对比顺序读和随机读的性能差异"
      ],
      resources: [
        "《深入理解计算机系统》第 3 版（CSAPP，Bryan Bryant，中文版）—— 配套 CMU 15-213 课程",
        "CMU 15-213/15-513 课程主页（http://csapp.cs.cmu.edu/）—— 视频 + Lab 全部公开",
        "Nand2Tetris（https://www.nand2tetris.org/）—— 从逻辑门到操作系统，无门槛，适合先建立整体感"
      ]
    },
    {
      id: "operating-system",
      title: "操作系统",
      domain: "system",
      core: true,
      status: "unlearned",
      position: { x: 720, y: 320 },
      why: "早期计算机一次只能运行一个程序。程序变多后，它们争抢 CPU、内存和 I/O。操作系统被发明出来，就是为了让多个程序公平、安全地共享一台机器，同时向上层程序屏蔽硬件差异。理解 OS 不是为了写内核，而是为了真正理解进程崩溃、内存溢出、IO 阻塞、死锁这些每天都会遇到的问题从何而来。",
      problems: [
        "fork() 之后子进程和父进程的内存是共享的还是独立的？",
        "为什么锁用不好会死锁，用太多会慢？",
        "程序 malloc 了 1GB，但实际用了多少物理内存？",
        "数据库的事务如何用操作系统的日志来保证？",
        "为什么 SSD 比 HDD 快，但随机写还是会慢？"
      ],
      prerequisites: ["CSAPP 或 组成原理", "C 语言", "数据结构"],
      path: [
        "进程与线程：创建、调度、上下文切换",
        "内存管理：虚拟地址、分页、TLB、页替换算法",
        "并发：互斥锁、信号量、条件变量、死锁检测",
        "文件系统：inode、目录树、日志（journaling）",
        "I/O：设备驱动、中断、DMA",
        "虚拟化概念：容器与 VM 的区别"
      ],
      projects: [
        "MIT 6.S081 xv6 Labs：实现系统调用、lazy allocation、写时复制 fork、网络驱动（11 个 Lab，质量极高）",
        "OSTEP 课后练习：手写线程库、实现简化版文件系统",
        "NJU OS 课程实验（南京大学蒋炎岩，全中文，基于真实 Linux，强烈推荐国内同学）"
      ],
      resources: [
        "《Operating Systems: Three Easy Pieces》（OSTEP，免费在线，http://ostep.org/，公认最好的 OS 入门书）",
        "MIT 6.S081（https://pdos.csail.mit.edu/6.828/），xv6 实验，PDOS 实验室出品",
        "南京大学操作系统（蒋炎岩，B 站免费，全中文，代码示例丰富，强烈推荐）",
        "UCB CS162（Pintos 操作系统实验，北大操作系统实验班也在用）"
      ]
    },
    {
      id: "network",
      title: "计算机网络",
      domain: "system",
      core: true,
      status: "unlearned",
      position: { x: 720, y: 560 },
      why: "所有互联网产品都建立在网络协议栈上。理解网络不是为了通过面试默写 TCP 三次握手，而是为了当 HTTP 请求超时、WebSocket 断连、HTTPS 证书报错时，你知道问题出在哪一层、怎么诊断。TCP 的可靠性是靠什么保证的？DNS 查询为什么有时候会慢？CDN 的原理是什么？这些问题的答案都在网络基础里。",
      problems: [
        "浏览器输入 URL 到页面显示，经过了哪些步骤？",
        "TCP 的可靠传输是靠什么保证的？重传机制怎么工作？",
        "HTTPS 握手过程中，如何防止中间人攻击？",
        "为什么 HTTP/2 比 HTTP/1.1 快？HTTP/3 又解决了什么？",
        "为什么 UDP 在视频通话中反而比 TCP 更合适？"
      ],
      prerequisites: ["操作系统（进程、I/O 模型）", "基础 C 或 Python"],
      path: [
        "应用层：HTTP/1.1、HTTP/2、HTTP/3、DNS、SMTP",
        "传输层：TCP（三次握手、拥塞控制、流量控制）、UDP",
        "网络层：IP、路由、NAT、ICMP",
        "数据链路层：以太网、ARP、MAC 地址",
        "安全：TLS/SSL 握手、证书体系、常见攻击（XSS、CSRF、中间人）",
        "Socket 编程：用代码实现 TCP/UDP 通信"
      ],
      projects: [
        "用 Wireshark 抓包分析 HTTP/HTTPS/DNS 流量，理解每一层报文结构",
        "用 Python socket 实现简化版 HTTP/1.1 服务器，支持 GET 请求和静态文件",
        "Stanford CS144 Lab（用 C++ 从零实现 TCP 协议栈，质量极高）"
      ],
      resources: [
        "《计算机网络：自顶向下方法》（Kurose & Ross，最经典教材，配套 Wireshark 实验）",
        "Stanford CS144（https://cs144.github.io/，免费，TCP 实验从零实现，强烈推荐）",
        "《图解 HTTP》《图解 TCP/IP》（入门友好，日文原版，中文翻译质量可以）",
        "Beej's Guide to Network Programming（https://beej.us/guide/bgnet/，Socket 编程圣经，免费）"
      ]
    },
    {
      id: "database",
      title: "数据库原理与实践",
      domain: "backend",
      core: true,
      status: "unlearned",
      position: { x: 720, y: 720 },
      why: "几乎所有有状态的软件都依赖数据库。但大多数人只会「会用 SQL」，不理解事务为什么需要四个隔离级别、索引为什么会让某些查询反而变慢、B+ 树和 LSM Tree 各自适合什么场景。数据库课程的目标不是让你背 SQL 语法，而是理解数据存储、查询优化和并发控制背后的设计权衡。",
      problems: [
        "为什么同一个 SQL 有时候快有时候慢？EXPLAIN 怎么看？",
        "事务的四个隔离级别分别防了什么问题？",
        "索引的本质是什么？什么时候加索引反而有害？",
        "数据库崩溃后如何保证已提交的数据不丢失？（WAL 原理）"
      ],
      prerequisites: ["数据结构（B 树、哈希表）", "操作系统（文件系统、I/O）"],
      path: [
        "关系模型：表、关系、范式（1NF/2NF/3NF）",
        "SQL：SELECT/JOIN/聚合/窗口函数/子查询",
        "存储引擎：堆文件、B+ 树索引、LSM Tree 概念",
        "事务：ACID 属性、2PL 并发控制、MVCC",
        "查询优化：查询计划、代价估算、索引选择",
        "分布式数据库入门：主从复制、分片、CAP 定理"
      ],
      projects: [
        "CMU 15-445 BusTub Labs（用 C++ 实现缓冲池、B+ 树索引、查询执行器，顶级课程实验）",
        "用 PostgreSQL 设计一个电商系统数据库，写复杂查询并用 EXPLAIN ANALYZE 优化"
      ],
      resources: [
        "CMU 15-445（https://15445.courses.cs.cmu.edu/，Andy Pavlo 主讲，B站有视频，实验质量极高）",
        "《数据库系统概念》（Silberschatz，经典教材，第七版，中文版可用）",
        "《设计数据密集型应用》DDIA（Martin Kleppmann，进阶必读，中文版《数据密集型应用系统设计》）",
        "Use The Index, Luke（https://use-the-index-luke.com/，免费，专讲索引原理和优化）"
      ]
    },
    {
      id: "html-css",
      title: "HTML & CSS 基础",
      domain: "frontend",
      core: false,
      status: "unlearned",
      position: { x: 80, y: 880 },
      why: "HTML 和 CSS 是 Web 的基础语言。HTML 描述内容结构，CSS 控制视觉表现。它们看起来简单，但真正掌握盒模型、Flexbox、Grid、响应式布局需要系统练习。很多工程师写了多年 CSS 还是靠试错——理解规则才能预测行为。",
      problems: [
        "为什么我的元素不居中？各种居中方法的区别？",
        "Flexbox 和 Grid 分别适合什么场景？",
        "响应式布局怎么做？媒体查询的断点怎么设计？",
        "CSS 优先级规则是什么？为什么我的样式被覆盖了？"
      ],
      prerequisites: ["基础计算机操作"],
      path: [
        "HTML 语义化标签：section、article、nav、aside",
        "CSS 盒模型：content、padding、border、margin",
        "Flexbox 布局：主轴/交叉轴、flex-grow/shrink/basis",
        "CSS Grid：模板列行、命名区域、自动填充",
        "响应式：media query、视口单位（vw/vh/rem）",
        "CSS 变量与现代特性：custom properties、clamp()"
      ],
      projects: [
        "用纯 HTML/CSS 复刻一个真实网站首页（不用框架），注重像素级还原",
        "写一个响应式个人主页，在手机/平板/桌面三个断点都好看"
      ],
      resources: [
        "MDN Web Docs（https://developer.mozilla.org/zh-CN/，中文版，最权威的 Web 参考）",
        "CSS-Tricks（https://css-tricks.com/，Flexbox 和 Grid 指南是业界最好的图文教程）",
        "《CSS 权威指南》第四版（Eric Meyer，最系统的 CSS 书）",
        "freeCodeCamp Responsive Web Design（免费，边学边练，有证书）"
      ]
    },
    {
      id: "javascript",
      title: "JavaScript 核心与异步",
      domain: "frontend",
      core: true,
      status: "unlearned",
      position: { x: 300, y: 880 },
      why: "JavaScript 是唯一能在浏览器里运行的编程语言，也借助 Node.js 成为了服务端语言。它的设计有很多历史包袱，但理解事件循环、闭包、原型链和异步模型是写出可维护代码的前提。很多 JS 的「奇怪行为」背后都有逻辑——了解规则比记规避技巧更有价值。",
      problems: [
        "为什么 setTimeout 里 this 指向会变？",
        "Promise 和 async/await 的底层是什么？",
        "事件循环、宏任务、微任务的执行顺序？",
        "闭包是什么？为什么循环里的 setTimeout 经典坑会发生？"
      ],
      prerequisites: ["HTML & CSS 基础", "任意一门编程语言基础"],
      path: [
        "变量作用域：var/let/const、提升（hoisting）、闭包",
        "原型与继承：prototype chain、class 语法糖",
        "异步编程：callback → Promise → async/await → 错误处理",
        "事件循环：call stack、Web APIs、macro/micro task queue",
        "ES6+：解构、展开、模板字符串、模块（import/export）",
        "DOM 操作与事件：事件冒泡/捕获、事件委托"
      ],
      projects: [
        "不用框架，用原生 JS 实现一个 Todo App，包含增删改查和本地持久化",
        "实现一个简版 Promise（支持 then/catch/finally/all），理解 Promise 内部机制"
      ],
      resources: [
        "《JavaScript 高级程序设计》第四版（红宝书，最系统的 JS 书，中文版质量高）",
        "《你不知道的 JavaScript》（You Don't Know JS，深入原型链和异步，GitHub 免费）",
        "javascript.info（https://javascript.info/，最好的在线 JS 教程，中文版可用）",
        "Kyle Simpson 的 JS 系列课程（Frontend Masters，付费但质量极高）"
      ]
    },
    {
      id: "react",
      title: "React 与现代前端",
      domain: "frontend",
      core: true,
      status: "unlearned",
      position: { x: 520, y: 880 },
      why: "React 把 UI 变成了「状态的函数」，这个模型极大降低了复杂交互的认知负担。理解组件化、状态管理和副作用模型，才能构建可维护的大型前端应用。Next.js 进一步解决了 SSR、路由和全栈整合的问题，是目前 React 生态的主流选择。",
      problems: [
        "为什么 React 要用虚拟 DOM？它的 diff 算法解决了什么问题？",
        "useState 和 useEffect 的依赖数组为什么这么重要？",
        "什么时候应该用 Context，什么时候需要 Zustand/Redux？",
        "服务端渲染（SSR）和客户端渲染（CSR）各自的权衡是什么？"
      ],
      prerequisites: ["JavaScript 核心与异步", "HTML & CSS 基础"],
      path: [
        "组件模型：函数组件、props、children、组合模式",
        "Hooks：useState、useEffect、useRef、useCallback、useMemo",
        "状态管理：Context API、Zustand（轻量）、React Query（服务端状态）",
        "路由：React Router 或 Next.js App Router",
        "Next.js：SSR/SSG/ISR、API Routes、Server Components",
        "TypeScript + React：类型化 props、事件、泛型组件"
      ],
      projects: [
        "用 Next.js + TypeScript 搭建个人博客，支持 Markdown、标签筛选、RSS",
        "用 React + React Query 做一个 GitHub 用户搜索页，完整处理加载/错误/缓存状态"
      ],
      resources: [
        "React 官方文档（https://react.dev/，新版文档用交互式 Playground，质量极高）",
        "Next.js 官方文档（https://nextjs.org/docs，App Router 教程系统完整）",
        "《React 设计模式与最佳实践》（Carlos Santana，进阶模式书）",
        "Josh Comeau 的 CSS-for-JS 和 Joy of React（https://www.joyofreact.com/，付费但评价极高）"
      ]
    },
    {
      id: "backend",
      title: "后端开发与 API 设计",
      domain: "backend",
      core: true,
      status: "unlearned",
      position: { x: 740, y: 880 },
      why: "前端负责展示，后端负责处理业务逻辑、数据存储和服务边界。好的后端设计不只是「能跑就行」，而是在扩展时不崩溃、在出错时能恢复、在并发时能保持正确性。API 设计是前后端的契约，是团队协作效率的基础。",
      problems: [
        "REST 和 GraphQL 的核心区别是什么？各自适合什么场景？",
        "如何设计一个能支持百万用户的 API？瓶颈在哪？",
        "认证（Authentication）和授权（Authorization）的区别？JWT 和 Session 如何选？",
        "如何保证 API 的幂等性？为什么这在支付场景中至关重要？"
      ],
      prerequisites: ["JavaScript 或 Python 基础", "数据库原理"],
      path: [
        "HTTP 方法语义：GET/POST/PUT/PATCH/DELETE 的正确用法",
        "RESTful API 设计：资源建模、状态码、版本控制",
        "认证与授权：JWT、Session/Cookie、OAuth2 基础",
        "数据库集成：ORM（Prisma/SQLAlchemy）vs 原生 SQL",
        "错误处理与日志：结构化错误响应、请求追踪",
        "基础安全：SQL 注入、XSS、CSRF 防御，输入校验"
      ],
      projects: [
        "用 Node.js/Fastify 或 Python/FastAPI 实现一个带 JWT 认证的博客 API，支持用户注册、发帖、评论",
        "给上面的 API 写 OpenAPI 文档，并加上请求参数校验和统一错误格式"
      ],
      resources: [
        "FastAPI 官方文档（https://fastapi.tiangolo.com/zh/，Python 生态最好的 API 框架，文档极佳）",
        "Node.js Fastify 文档（https://fastify.dev/，性能最强的 Node HTTP 框架）",
        "《RESTful API 设计规范》（Google API Design Guide，https://cloud.google.com/apis/design）",
        "《系统设计面试》Alex Xu（入门系统设计，中文版《系统设计面试：内幕指南》）"
      ]
    },
    {
      id: "linux-docker",
      title: "Linux 与容器化部署",
      domain: "engineering",
      core: false,
      status: "unlearned",
      position: { x: 960, y: 880 },
      why: "所有生产环境的软件都运行在 Linux 上。Docker 把「在我机器上能跑」变成了「在任何机器上都能跑」。理解进程管理、文件系统挂载、网络命名空间，才能真正掌握容器技术，而不只是会写 Dockerfile。",
      problems: [
        "为什么同样的代码在本地能跑，到服务器就挂？",
        "Docker 容器和虚拟机的本质区别是什么？",
        "如何设计一个合理的多阶段 Dockerfile，让镜像体积最小？",
        "Nginx 配置反向代理、HTTPS 和静态文件服务的基本模式是什么？"
      ],
      prerequisites: ["操作系统基础", "任意后端语言"],
      path: [
        "Linux 基础：文件系统层级、权限模型、进程管理、systemd",
        "Shell 脚本：条件判断、循环、函数、管道",
        "Docker：镜像/容器/层、Dockerfile 最佳实践、多阶段构建",
        "Docker Compose：多服务编排、网络、Volume 挂载",
        "Nginx：反向代理、负载均衡、静态资源服务、HTTPS 配置",
        "CI/CD 基础：GitHub Actions 工作流，自动化测试与部署"
      ],
      projects: [
        "把之前写的后端 API 容器化，用 Docker Compose 编排 API + PostgreSQL + Redis，一键启动",
        "用 GitHub Actions 实现自动化：push 到 main 分支后自动构建镜像、推到 Docker Hub、SSH 部署到服务器"
      ],
      resources: [
        "《鸟哥的 Linux 私房菜》（最经典的中文 Linux 入门书，基础命令全覆盖）",
        "Docker 官方文档 Get Started（https://docs.docker.com/get-started/，官方教程，系统完整）",
        "Play with Docker（https://labs.play-with-docker.com/，免费在线 Docker 环境，无需安装）",
        "GitHub Actions 文档（https://docs.github.com/en/actions，官方文档，入门 CI/CD 最直接的方式）"
      ]
    }
  ],
  edges: [
    { id: "e1", source: "missing-semester", target: "discrete-math", kind: "related" },
    { id: "e2", source: "discrete-math", target: "data-structure", kind: "dependency" },
    { id: "e3", source: "data-structure", target: "csapp", kind: "dependency" },
    { id: "e4", source: "csapp", target: "operating-system", kind: "dependency" },
    { id: "e5", source: "csapp", target: "network", kind: "dependency" },
    { id: "e6", source: "operating-system", target: "database", kind: "related" },
    { id: "e7", source: "network", target: "database", kind: "related" },
    { id: "e8", source: "missing-semester", target: "html-css", kind: "related" },
    { id: "e9", source: "html-css", target: "javascript", kind: "dependency" },
    { id: "e10", source: "javascript", target: "react", kind: "dependency" },
    { id: "e11", source: "database", target: "backend", kind: "dependency" },
    { id: "e12", source: "react", target: "backend", kind: "related" },
    { id: "e13", source: "backend", target: "linux-docker", kind: "related" },
    { id: "e14", source: "operating-system", target: "linux-docker", kind: "dependency" }
  ]
};

// ─────────────────────────────────────────────
// 路线二：CS基础自学路线（CSDIY精选）
// ─────────────────────────────────────────────
export const csdiyRoute: Route = {
  title: "CS 基础自学路线（CSDIY 精选）",
  description: "精选 UCB、MIT、Stanford、CMU 的顶级 CS 基础课程，每门课都有公开视频、讲义和编程实验。适合想系统补 CS 基础的同学。",
  summary: "10 门顶级大学公开课，覆盖编程、数学、系统、网络、数据库、AI 基础。",
  domains: {
    math:        "数学是 CS 的语言，离不开逻辑、概率和线性代数。",
    system:      "系统课程揭示程序如何在真实硬件上运行。",
    programming: "编程课训练你用代码优雅地表达思维。",
    frontend:    "前端工程以用户体验为中心。",
    backend:     "后端处理数据、逻辑与服务。",
    engineering: "工程化让软件可被部署、维护和演化。",
    ai:          "AI 课程教你从数学到模型的完整路径。"
  },
  nodes: [
    {
      id: "csdiy-missing",
      title: "MIT Missing Semester",
      domain: "engineering",
      core: false,
      status: "unlearned",
      position: { x: 80, y: 40 },
      why: "在学任何 CS 课程之前，先把工具学好。Shell、Git、Vim、调试器和性能分析是每天都在用的基础设施，却从来不在课程表里。Missing Semester 专门补这个缺口。",
      problems: [
        "如何用 Shell 自动化重复性任务？",
        "Git 的 rebase、cherry-pick 和 bisect 分别解决什么问题？",
        "如何用调试器而不是 print 来定位 bug？"
      ],
      prerequisites: ["基础计算机操作"],
      path: [
        "Shell 与脚本（bash）",
        "Vim 操作",
        "Git 进阶",
        "调试与性能分析",
        "密钥与安全基础"
      ],
      projects: [
        "配置完整的 dotfiles 仓库并发布到 GitHub",
        "写一个 Shell 脚本完成日常文件整理任务"
      ],
      resources: [
        "MIT Missing Semester（https://missing.csail.mit.edu/，全部免费，中文字幕）"
      ]
    },
    {
      id: "csdiy-cs61a",
      title: "UCB CS61A：编程的结构与解释",
      domain: "programming",
      core: true,
      status: "unlearned",
      position: { x: 300, y: 40 },
      why: "CS61A 不是在教你 Python，而是在教你用代码表达思维。递归、高阶函数、数据抽象、面向对象——它把 SICP 的思想用 Python 重新呈现，是目前最好的编程入门课之一。",
      problems: [
        "递归和迭代的本质区别是什么？",
        "什么是高阶函数？为什么函数可以作为参数？",
        "面向对象的「对象」本质上是什么？"
      ],
      prerequisites: ["高中数学"],
      path: [
        "Python 基础与函数抽象",
        "递归与树递归",
        "高阶函数与 Lambda",
        "面向对象编程",
        "Scheme 解释器（理解语言本身）",
        "SQL 基础"
      ],
      projects: [
        "CS61A Hog 项目（掷骰子策略游戏）",
        "CS61A Ants vs. SomeBees 项目（塔防游戏）",
        "CS61A Scheme 解释器（用 Python 实现 Scheme）"
      ],
      resources: [
        "UCB CS61A 官网（https://cs61a.org/，Composing Programs 在线教材免费，历年作业可下载）",
        "SICP（https://mitpress.mit.edu/sicp/，经典原著，CS61A 的思想源头）"
      ]
    },
    {
      id: "csdiy-cs61b",
      title: "UCB CS61B：数据结构与算法",
      domain: "programming",
      core: true,
      status: "unlearned",
      position: { x: 520, y: 40 },
      why: "CS61B 用 Java 教数据结构，但重点不是 Java，而是如何选择正确的数据结构解决问题，以及如何分析算法的时间和空间复杂度。它的编程实验设计得非常好，直接在真实项目上练手。",
      problems: [
        "为什么哈希表的平均查找是 O(1) 但最坏是 O(n)？",
        "红黑树是如何保证插入删除后仍然平衡的？",
        "图的 BFS 和 DFS 分别适合解决什么问题？"
      ],
      prerequisites: ["UCB CS61A 或同等编程基础"],
      path: [
        "Java 基础与面向对象",
        "列表、栈、队列、树",
        "BST、AVL 树、红黑树",
        "哈希表与哈希集合",
        "图：BFS、DFS、Dijkstra、Prim、Kruskal",
        "排序：归并、快排、堆排序"
      ],
      projects: [
        "CS61B Project 1：实现双端队列（链表版和数组版）",
        "CS61B Project 2：Gitlet（用 Java 实现简化版 Git）",
        "CS61B Project 3：BearMaps（地图导航应用，A* 寻路）"
      ],
      resources: [
        "UCB CS61B（https://sp21.datastructur.es/，2021 春季版视频最全，实验框架公开）",
        "《算法》第四版（Sedgewick，配套 CS61B，Java 实现，Princeton Coursera 有配套课程）"
      ]
    },
    {
      id: "csdiy-cs70",
      title: "UCB CS70：离散数学与概率论",
      domain: "math",
      core: true,
      status: "unlearned",
      position: { x: 740, y: 40 },
      why: "CS70 是 UCB 最硬核的 CS 基础课之一。它覆盖图论、数论、概率论和随机算法，是机器学习、密码学和算法分析的数学基础。证明能力的培养是隐藏目标。",
      problems: [
        "RSA 加密的数学原理是什么？",
        "为什么随机哈希函数能以高概率避免碰撞？",
        "马尔可夫链的稳态分布怎么计算？"
      ],
      prerequisites: ["高中数学（函数、排列组合）"],
      path: [
        "命题逻辑与证明方法（归纳、反证）",
        "图论：连通性、二部图、欧拉路径",
        "数论：模运算、费马小定理、RSA",
        "概率论：条件概率、贝叶斯定理、期望与方差",
        "随机变量与分布：二项分布、泊松分布、正态分布",
        "马尔可夫链与随机游走"
      ],
      projects: [
        "CS70 作业：证明题训练（最有价值的部分）",
        "用 Python 模拟随机游走和马尔可夫链收敛"
      ],
      resources: [
        "UCB CS70 官网（https://www.eecs70.org/，讲义和历年题目免费）",
        "《概率导论》（Bertsekas & Tsitsiklis，MITx 6.041 配套教材，最严谨的概率入门）"
      ]
    },
    {
      id: "csdiy-cs61c",
      title: "UCB CS61C：计算机组成原理",
      domain: "system",
      core: true,
      status: "unlearned",
      position: { x: 80, y: 320 },
      why: "CS61C 打通了从 C 语言到 RISC-V 汇编，再到 CPU 电路的完整链路。你会理解为什么 C 的指针是危险的、为什么并行程序会有 race condition、以及 CPU 如何在一个时钟周期内完成一条指令。",
      problems: [
        "为什么 C 的指针运算比其他语言危险得多？",
        "CPU 流水线如何提升吞吐量？数据冒险怎么处理？",
        "缓存的局部性原理如何影响程序性能？"
      ],
      prerequisites: ["UCB CS61A、UCB CS61B", "基础数字逻辑"],
      path: [
        "C 语言：指针、内存管理、结构体",
        "RISC-V 汇编：寄存器、指令集、调用约定",
        "处理器设计：单周期 CPU、流水线",
        "内存层次：缓存、虚拟内存",
        "并行计算：SIMD、多线程、CUDA 基础"
      ],
      projects: [
        "CS61C Project：用 C 实现矩阵乘法并用 SIMD 优化",
        "CS61C Logisim 项目：在数字电路模拟器里搭建 CPU"
      ],
      resources: [
        "UCB CS61C（https://cs61c.org/，视频和讲义免费，实验框架公开）",
        "《计算机组成与设计》Patterson & Hennessy（RISC-V 版，经典教材）"
      ]
    },
    {
      id: "csdiy-6s081",
      title: "MIT 6.S081：操作系统",
      domain: "system",
      core: true,
      status: "unlearned",
      position: { x: 300, y: 320 },
      why: "MIT 6.S081 是目前公认最好的 OS 实践课。你不是在听讲，而是在 xv6（一个真实的小型 Unix 系统）上实现系统调用、内存分配、文件系统和网络驱动。11 个 Lab，每一个都让你真正理解一个 OS 概念。",
      problems: [
        "系统调用是如何从用户态切换到内核态的？",
        "为什么 fork 之后父子进程修改变量互不影响？（写时复制）",
        "文件系统崩溃恢复是如何用日志实现的？"
      ],
      prerequisites: ["UCB CS61C 或同等计算机组成基础", "C 语言"],
      path: [
        "xv6 代码阅读：进程、内存、文件系统",
        "Lab 1：Unix 工具（shell 管道、find）",
        "Lab 2：系统调用（trace、sysinfo）",
        "Lab 3：页表（内核页表、加速系统调用）",
        "Lab 4：Trap（alarm、sigreturn）",
        "Lab 5-11：懒分配、写时复制、线程、网络、文件系统、mmap"
      ],
      projects: [
        "完成 MIT 6.S081 全部 11 个 Lab（每个 Lab 都是独立且完整的 OS 实现练习）"
      ],
      resources: [
        "MIT 6.S081（https://pdos.csail.mit.edu/6.828/2021/，视频、讲义、xv6 源码全部免费）",
        "《Operating Systems: Three Easy Pieces》OSTEP（http://ostep.org/，免费，OS 最佳入门书）"
      ]
    },
    {
      id: "csdiy-cs144",
      title: "Stanford CS144：计算机网络",
      domain: "system",
      core: true,
      status: "unlearned",
      position: { x: 520, y: 320 },
      why: "CS144 最出名的是它的 Lab：用 C++ 从零实现 TCP 协议栈。不是理解 TCP，而是实现 TCP——包括流量控制、拥塞控制和连接管理。做完这个 Lab，你对网络的理解会上升一个数量级。",
      problems: [
        "TCP 的可靠传输是靠什么保证的？如何用代码实现？",
        "滑动窗口协议如何同时实现流量控制和高吞吐？",
        "路由器如何决定一个数据包应该往哪里转发？"
      ],
      prerequisites: ["UCB CS61C 或同等系统基础", "C++ 基础"],
      path: [
        "Lab 0：用 C++ 实现字节流",
        "Lab 1：重组器（TCP 乱序包）",
        "Lab 2：TCP 接收方",
        "Lab 3：TCP 发送方（重传、窗口）",
        "Lab 4：TCP 连接（三次握手、四次挥手）",
        "Lab 5-7：网络接口、IP 路由器"
      ],
      projects: [
        "Stanford CS144 完整 Lab（https://cs144.github.io/，用 C++ 从零实现 TCP 协议栈）"
      ],
      resources: [
        "Stanford CS144（https://cs144.github.io/，实验材料免费，Bilibili 有往年视频）",
        "《计算机网络：自顶向下方法》Kurose & Ross（CS144 配套教材）"
      ]
    },
    {
      id: "csdiy-15445",
      title: "CMU 15-445：数据库系统",
      domain: "backend",
      core: true,
      status: "unlearned",
      position: { x: 740, y: 320 },
      why: "CMU 15-445 由 Andy Pavlo 主讲，是数据库领域最好的公开课之一。你会从存储引擎到查询优化到并发控制，一路实现一个完整的关系型数据库（BusTub）。做完四个 Project，你对数据库的理解会远超「会写 SQL」。",
      problems: [
        "数据库崩溃后如何保证已提交事务不丢失？（WAL + ARIES）",
        "B+ 树并发访问时如何安全地加锁？（Crabbing Protocol）",
        "查询优化器如何估算一个 JOIN 的代价？"
      ],
      prerequisites: ["数据结构与算法", "C++ 基础"],
      path: [
        "Project 0：C++ 入门（跳绳热身）",
        "Project 1：Buffer Pool Manager（缓冲池实现）",
        "Project 2：B+ Tree Index（B+ 树实现）",
        "Project 3：Query Execution（查询执行器）",
        "Project 4：Concurrency Control（2PL 并发控制）"
      ],
      projects: [
        "CMU 15-445 四个 Project（https://15445.courses.cs.cmu.edu/，框架代码公开，自动评测）"
      ],
      resources: [
        "CMU 15-445（https://15445.courses.cs.cmu.edu/，视频 B 站可看，Project 框架 GitHub 公开）",
        "《数据库系统概念》Silberschatz（15-445 配套教材，第七版）",
        "《设计数据密集型应用》DDIA（进阶必读，了解真实世界的数据库设计）"
      ]
    },
    {
      id: "csdiy-cs169",
      title: "UCB CS169：软件工程",
      domain: "engineering",
      core: false,
      status: "unlearned",
      position: { x: 80, y: 600 },
      why: "CS169 教你如何在真实项目中工作：敏捷开发、测试驱动开发、代码重构、技术债务管理。它不是抽象的「软件工程原则」讲座，而是用 Ruby on Rails 完成一个真实的客户项目。",
      problems: [
        "如何写出有价值的单元测试而不是「测试覆盖率」？",
        "技术债务是什么？如何在迭代中系统性地偿还？",
        "如何在没有完整需求文档的情况下推进项目？"
      ],
      prerequisites: ["任意后端语言基础", "数据库基础"],
      path: [
        "敏捷开发与 Scrum",
        "BDD（行为驱动开发）：Cucumber/RSpec",
        "TDD（测试驱动开发）",
        "代码重构：坏味道识别与重构模式",
        "设计模式：MVC、Observer、Factory",
        "持续集成与部署"
      ],
      projects: [
        "UCB CS169 课程项目：和真实非营利组织合作，完成一个 Rails Web 应用"
      ],
      resources: [
        "《Engineering Software as a Service》Fox & Patterson（CS169 教材，有免费在线版本）",
        "Refactoring.guru（https://refactoring.guru/，重构模式和设计模式的最佳图文教程）"
      ]
    },
    {
      id: "csdiy-cs229",
      title: "Stanford CS229：机器学习",
      domain: "ai",
      core: false,
      status: "unlearned",
      position: { x: 300, y: 600 },
      why: "CS229 是 Andrew Ng 在 Stanford 开设的机器学习课，也是最著名的 ML 入门课之一。它从数学推导出发，而不只是教你调 API。理解线性回归、SVM、神经网络、EM 算法背后的数学，才能在模型不符合预期时知道该怎么改。",
      problems: [
        "梯度下降为什么能找到最优解？它什么时候会陷入局部最优？",
        "正则化（L1/L2）是如何防止过拟合的？",
        "EM 算法解决了什么问题？GMM 的直觉是什么？"
      ],
      prerequisites: ["线性代数", "概率论（UCB CS70 或同等）", "Python"],
      path: [
        "监督学习：线性回归、逻辑回归、SVM",
        "正则化与模型选择：偏差方差权衡",
        "无监督学习：K-means、PCA、GMM、EM",
        "神经网络与反向传播",
        "强化学习基础：MDP、策略梯度"
      ],
      projects: [
        "Stanford CS229 Problem Sets（数学推导 + 编程，从零实现 SVM、神经网络）",
        "Kaggle 入门竞赛（用所学模型参加 Titanic / House Prices 竞赛）"
      ],
      resources: [
        "Stanford CS229（http://cs229.stanford.edu/，讲义免费，YouTube 有完整视频）",
        "《机器学习》周志华（西瓜书，中文最系统的 ML 教材，推导详细）",
        "fast.ai（https://www.fast.ai/，自顶向下的 DL 入门，和 CS229 互补）"
      ]
    }
  ],
  edges: [
    { id: "e1", source: "csdiy-missing", target: "csdiy-cs61a", kind: "related" },
    { id: "e2", source: "csdiy-cs61a", target: "csdiy-cs61b", kind: "dependency" },
    { id: "e3", source: "csdiy-cs61b", target: "csdiy-cs61c", kind: "dependency" },
    { id: "e4", source: "csdiy-cs70", target: "csdiy-cs61b", kind: "related" },
    { id: "e5", source: "csdiy-cs61c", target: "csdiy-6s081", kind: "dependency" },
    { id: "e6", source: "csdiy-cs61c", target: "csdiy-cs144", kind: "dependency" },
    { id: "e7", source: "csdiy-cs61b", target: "csdiy-15445", kind: "dependency" },
    { id: "e8", source: "csdiy-6s081", target: "csdiy-cs169", kind: "related" },
    { id: "e9", source: "csdiy-15445", target: "csdiy-cs169", kind: "related" },
    { id: "e10", source: "csdiy-cs70", target: "csdiy-cs229", kind: "dependency" }
  ]
};

// ─────────────────────────────────────────────
// 路线三：AI 工程师路线
// ─────────────────────────────────────────────
export const aiEngineerRoute: Route = {
  title: "AI 工程师路线",
  description: "从数学基础到大模型应用开发，覆盖 PyTorch 训练、Transformer 原理、RAG、Fine-tuning 和生产部署。主打动手能力，每个节点都有真实项目。",
  summary: "10 个核心节点，从数学基础到模型训练到生产部署，覆盖 AI 工程师的完整技能树。",
  domains: {
    math:        "线性代数、微积分和概率论是理解模型的语言。",
    system:      "理解 GPU 架构和分布式训练是大模型工程的基础。",
    programming: "Python 是 AI 工程的主力语言。",
    frontend:    "AI 产品需要可用的界面来触达用户。",
    backend:     "模型需要 API 包装和工程化才能成为产品。",
    engineering: "模型部署、监控和迭代是 AI 工程的核心挑战。",
    ai:          "从理论到工程的完整 AI 知识体系。"
  },
  nodes: [
    {
      id: "ai-math",
      title: "AI 数学基础",
      domain: "math",
      core: true,
      status: "unlearned",
      position: { x: 80, y: 40 },
      why: "神经网络的训练本质是在高维空间里做优化。理解矩阵乘法（前向传播的本质）、梯度（反向传播的本质）和概率分布（损失函数的本质），才能真正理解为什么模型会训练，以及为什么会不收敛。",
      problems: [
        "矩阵乘法在神经网络里代表什么操作？",
        "梯度下降的方向为什么是梯度的反方向？",
        "交叉熵损失函数的直觉是什么？为什么不用均方误差做分类？"
      ],
      prerequisites: ["高中数学（函数、向量）"],
      path: [
        "线性代数：矩阵乘法、特征值、SVD 分解",
        "微积分：偏导数、链式法则、雅可比矩阵",
        "概率论：条件概率、贝叶斯定理、最大似然估计",
        "信息论：熵、KL 散度、交叉熵",
        "最优化：梯度下降、Adam、学习率调度"
      ],
      projects: [
        "用 NumPy 从零实现两层神经网络（前向传播 + 反向传播），不用 PyTorch",
        "3Blue1Brown 线性代数系列全部看完并做笔记"
      ],
      resources: [
        "3Blue1Brown《线性代数的本质》（B 站有中文版，最好的线性代数直觉培养）",
        "3Blue1Brown《神经网络》系列（直观理解反向传播）",
        "《深度学习》Goodfellow 第二章数学基础（免费在线，https://www.deeplearningbook.org/）",
        "Gilbert Strang MIT 18.06 线性代数（OCW 免费，最系统的大学线代课）"
      ]
    },
    {
      id: "ai-python",
      title: "Python 与科学计算栈",
      domain: "programming",
      core: true,
      status: "unlearned",
      position: { x: 300, y: 40 },
      why: "AI 工程的所有工具都在 Python 生态里。NumPy 的向量化操作替代循环、Pandas 处理结构化数据、Matplotlib 可视化——这些不是可选项，而是日常工作语言。",
      problems: [
        "为什么 NumPy 的向量化比 Python 循环快 100 倍？",
        "广播机制（broadcasting）是如何工作的？",
        "如何高效地处理 100GB 的 CSV 数据而不撑爆内存？"
      ],
      prerequisites: ["任意编程语言基础"],
      path: [
        "Python 进阶：列表推导、生成器、装饰器、类型提示",
        "NumPy：ndarray、广播、向量化操作、内存布局",
        "Pandas：DataFrame 操作、分组聚合、时间序列",
        "Matplotlib/Seaborn：数据可视化",
        "Jupyter Notebook 工作流"
      ],
      projects: [
        "用 Pandas 清洗并分析一个真实数据集（Kaggle 上找），做 EDA 并可视化",
        "用 NumPy 实现矩阵乘法的各种变体并做性能对比"
      ],
      resources: [
        "《利用 Python 进行数据分析》Wes McKinney（Pandas 作者写的，中文版质量高）",
        "fast.ai Practical Deep Learning for Coders（https://course.fast.ai/，Python + PyTorch 实战）",
        "NumPy 官方文档（https://numpy.org/doc/，入门教程就够用）"
      ]
    },
    {
      id: "ai-dl-foundation",
      title: "深度学习基础",
      domain: "ai",
      core: true,
      status: "unlearned",
      position: { x: 520, y: 40 },
      why: "深度学习的核心思想是：用数据自动发现特征，用梯度下降自动优化参数。理解 MLP、CNN、RNN 的设计动机，以及 BatchNorm、Dropout、残差连接解决了什么问题，是进入大模型时代的必要基础。",
      problems: [
        "为什么深层网络比浅层网络有优势？（表示能力）",
        "梯度消失和梯度爆炸是什么？残差连接如何解决？",
        "为什么 BatchNorm 能加速训练？它在推理时有什么不同？"
      ],
      prerequisites: ["AI 数学基础", "Python 与科学计算栈"],
      path: [
        "MLP：激活函数（ReLU/GELU）、初始化、反向传播",
        "CNN：卷积、池化、感受野、ResNet 架构",
        "正则化技术：Dropout、BatchNorm、LayerNorm、权重衰减",
        "优化器：SGD、Momentum、Adam、学习率调度",
        "PyTorch 基础：Tensor、autograd、Module、DataLoader"
      ],
      projects: [
        "用 PyTorch 训练 ResNet 在 CIFAR-10 上达到 90%+ 准确率",
        "Andrej Karpathy 的 makemore 系列（从 bigram 到 MLP 语言模型）"
      ],
      resources: [
        "fast.ai Practical Deep Learning（https://course.fast.ai/，自顶向下，强烈推荐）",
        "Andrej Karpathy 的 Neural Networks: Zero to Hero（https://karpathy.ai/zero-to-hero.html，最好的 DL 入门系列）",
        "PyTorch 官方 60 分钟闪电战（https://pytorch.org/tutorials/，入门最快的路径）"
      ]
    },
    {
      id: "ai-transformer",
      title: "Transformer 与大语言模型",
      domain: "ai",
      core: true,
      status: "unlearned",
      position: { x: 740, y: 40 },
      why: "Transformer 是当前 AI 的核心架构，GPT、BERT、T5、LLaMA 都是 Transformer 变体。理解注意力机制的直觉（哪些 token 应该相互关注）和数学（QKV 矩阵乘法）是进入大模型工程的门槛。",
      problems: [
        "Self-Attention 的 QKV 矩阵分别代表什么？",
        "为什么 Transformer 需要位置编码？RoPE 解决了什么问题？",
        "GPT 和 BERT 的训练目标有什么本质区别？"
      ],
      prerequisites: ["深度学习基础", "Python 与科学计算栈"],
      path: [
        "Attention 机制：Scaled Dot-Product Attention 推导",
        "Multi-Head Attention 和 Transformer Block",
        "位置编码：绝对位置编码、RoPE",
        "GPT 预训练：自回归语言模型、Next Token Prediction",
        "BERT 预训练：MLM、NSP",
        "现代大模型变体：LLaMA 架构、GQA、KV Cache"
      ],
      projects: [
        "Andrej Karpathy 的 nanoGPT（从零实现 GPT-2，用 Python + PyTorch，500 行代码）",
        "用 HuggingFace Transformers 微调 BERT 做文本分类"
      ],
      resources: [
        "Andrej Karpathy nanoGPT（https://github.com/karpathy/nanoGPT，代码和视频讲解）",
        "《Attention Is All You Need》原论文（必读，Transformer 的出发点）",
        "Illustrated Transformer（https://jalammar.github.io/illustrated-transformer/，最好的图文讲解）",
        "HuggingFace NLP Course（https://huggingface.co/learn/nlp-course，免费，实战导向）"
      ]
    },
    {
      id: "ai-prompt-rag",
      title: "Prompt 工程与 RAG",
      domain: "ai",
      core: true,
      status: "unlearned",
      position: { x: 80, y: 320 },
      why: "大多数 AI 应用不需要训练新模型，而是通过 Prompt 工程和 RAG（检索增强生成）让现有模型完成特定任务。理解上下文窗口的限制、向量检索的原理和 RAG 的架构，是 AI 应用工程师的核心技能。",
      problems: [
        "为什么「先思考再回答」的 prompt 比「直接回答」效果更好？",
        "RAG 和 Fine-tuning 分别适合什么场景？",
        "向量相似度搜索如何在百万文档中做到毫秒级检索？"
      ],
      prerequisites: ["Transformer 与大语言模型基础"],
      path: [
        "Prompt 工程：零样本、少样本、思维链（CoT）、ReAct",
        "向量嵌入：文本嵌入模型、余弦相似度",
        "向量数据库：Chroma、Pinecone、pgvector",
        "RAG 架构：文档分块、检索、重排序、生成",
        "评估：RAGAS 框架、检索质量指标"
      ],
      projects: [
        "用 LangChain 或 LlamaIndex 给自己的 PDF 文档库搭建 RAG 问答系统",
        "用 Anthropic API 实现一个带对话历史和工具调用的 AI 助手"
      ],
      resources: [
        "Anthropic Prompt Engineering Guide（https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview）",
        "LangChain 文档（https://python.langchain.com/docs/，RAG 入门最快的框架）",
        "DeepLearning.AI 短课程（https://www.deeplearning.ai/short-courses/，RAG/Agents/Evals 系列，免费）"
      ]
    },
    {
      id: "ai-pytorch",
      title: "PyTorch 工程实践",
      domain: "ai",
      core: true,
      status: "unlearned",
      position: { x: 300, y: 320 },
      why: "PyTorch 是学术界和工业界最主流的深度学习框架。掌握 PyTorch 不只是会用 API，而是理解自动微分的实现、如何写高效的自定义 Dataset/DataLoader、以及如何用 mixed precision 和梯度累积训练大模型。",
      problems: [
        "autograd 是如何自动计算梯度的？计算图是什么？",
        "如何自定义 Dataset 使数据加载不成为训练瓶颈？",
        "mixed precision（fp16/bf16）训练为什么能在不降低精度的情况下加速 2 倍？"
      ],
      prerequisites: ["深度学习基础"],
      path: [
        "Tensor 操作与 CUDA 加速",
        "自动微分：计算图、.grad、requires_grad",
        "自定义 Module 和 Loss Function",
        "DataLoader、Sampler、数据增强",
        "训练循环：混合精度、梯度裁剪、梯度累积",
        "模型保存/加载：state_dict、checkpoint"
      ],
      projects: [
        "用 PyTorch Lightning 训练一个图像分类模型，实现 mixed precision 和学习率自动调度",
        "实现一个自定义 Dataset 类，处理有噪声标注的数据集"
      ],
      resources: [
        "PyTorch 官方教程（https://pytorch.org/tutorials/，系统完整）",
        "PyTorch Lightning 文档（https://lightning.ai/docs/pytorch/stable/，工程实践最佳实践）",
        "Tim Dettmers《Making Deep Learning Go Brrrr》（量化和混合精度的深度好文）"
      ]
    },
    {
      id: "ai-finetune",
      title: "大模型微调",
      domain: "ai",
      core: false,
      status: "unlearned",
      position: { x: 520, y: 320 },
      why: "全量微调一个 70B 模型需要数百 GB 显存，但 LoRA/QLoRA 让你用消费级 GPU 就能微调大模型。理解参数高效微调的原理（为什么低秩矩阵可以捕捉领域知识），以及 RLHF/DPO 的训练流程，是 AI 工程师的进阶必备。",
      problems: [
        "LoRA 为什么能用极少参数达到接近全量微调的效果？",
        "SFT 和 RLHF/DPO 分别解决什么问题？",
        "如何防止微调后的模型「灾难性遗忘」？"
      ],
      prerequisites: ["PyTorch 工程实践", "Transformer 与大语言模型"],
      path: [
        "全量微调（Full Fine-tuning）：适用场景和成本",
        "LoRA/QLoRA：低秩分解原理、PEFT 库使用",
        "指令微调（Instruction Tuning）：数据格式和构造",
        "RLHF：奖励模型训练、PPO 基础",
        "DPO（直接偏好优化）：比 RLHF 更简单的对齐方法",
        "评估：困惑度、任务特定指标、人工评估"
      ],
      projects: [
        "用 QLoRA 微调 LLaMA 3 做特定领域的问答（用 Axolotl 或 LLaMA-Factory）",
        "用 DPO 训练一个对话偏好模型，比较微调前后的输出质量"
      ],
      resources: [
        "HuggingFace PEFT 文档（https://huggingface.co/docs/peft/，LoRA 最易用的实现）",
        "《LoRA: Low-Rank Adaptation》原论文（必读）",
        "LLaMA-Factory（https://github.com/hiyouga/LLaMA-Factory，中国团队开发，最易用的微调框架）",
        "Axolotl（https://github.com/axolotl-ai-cloud/axolotl，工业级微调工具）"
      ]
    },
    {
      id: "ai-api-backend",
      title: "AI 后端与 API 开发",
      domain: "backend",
      core: true,
      status: "unlearned",
      position: { x: 740, y: 320 },
      why: "模型能力需要 API 包装才能成为产品。AI 后端的特殊挑战在于流式响应（streaming）、长时任务、模型调用的错误处理和成本控制。理解如何用 FastAPI 包装模型、如何实现 SSE 流式输出、如何做速率限制，是 AI 工程师的核心工程技能。",
      problems: [
        "如何实现流式响应（streaming）让用户看到逐字输出？",
        "如何在 token 层面控制 AI API 的调用成本？",
        "如何设计 AI 应用的错误处理？模型超时、内容过滤怎么处理？"
      ],
      prerequisites: ["Python 基础", "HTTP 和 REST API 基础"],
      path: [
        "FastAPI：路由、依赖注入、异步处理、自动文档",
        "LLM API 调用：OpenAI/Anthropic SDK、流式输出（SSE）",
        "AI SDK（Vercel）：前后端一体化流式 AI 接口",
        "数据库：用 SQLModel/SQLAlchemy 持久化对话历史",
        "缓存与速率限制：Redis、Token 计数、成本控制",
        "异步任务：Celery/ARQ 处理长时推理任务"
      ],
      projects: [
        "用 FastAPI 包装任意 LLM 实现流式聊天 API，支持对话历史和 Token 统计",
        "用 Vercel AI SDK 搭建一个多模型切换的前后端全栈 AI 应用"
      ],
      resources: [
        "FastAPI 官方文档（https://fastapi.tiangolo.com/zh/，中文，最好的 Python API 框架）",
        "Vercel AI SDK（https://sdk.vercel.ai/docs，前后端全栈 AI 开发最快路径）",
        "Anthropic API 文档（https://docs.anthropic.com/，Messages API 和工具调用参考）"
      ]
    },
    {
      id: "ai-frontend",
      title: "AI 应用前端开发",
      domain: "frontend",
      core: false,
      status: "unlearned",
      position: { x: 80, y: 600 },
      why: "AI 产品的用户体验在前端。流式输出的打字机效果、Markdown 渲染、对话界面的状态管理——这些细节决定了用户对产品的感受。用 Next.js + Vercel AI SDK 可以用极少代码实现生产级 AI 聊天界面。",
      problems: [
        "如何在前端消费 SSE 流式响应并实现打字机效果？",
        "多轮对话的状态应该放在哪里管理？",
        "如何优雅地处理 AI 响应中的 Markdown、代码高亮和数学公式？"
      ],
      prerequisites: ["React 基础", "AI 后端与 API 开发"],
      path: [
        "Next.js App Router + Server Actions",
        "Vercel AI SDK useChat/useCompletion Hooks",
        "流式 UI：React Suspense、StreamingTextResponse",
        "Markdown 渲染：react-markdown、语法高亮",
        "UI 组件：shadcn/ui、Tailwind CSS",
        "状态管理：Zustand 管理对话历史"
      ],
      projects: [
        "用 Next.js + Vercel AI SDK 从零搭建一个 ChatGPT 克隆，支持流式输出、代码高亮和会话管理",
        "给已有 AI 应用加上「引用来源」展示功能（RAG 结果溯源）"
      ],
      resources: [
        "Vercel AI SDK 文档（https://sdk.vercel.ai/docs，最快速的 AI 前端开发方式）",
        "shadcn/ui（https://ui.shadcn.com/，最流行的 React 组件库，AI 应用 UI 首选）",
        "Next.js 官方文档（https://nextjs.org/docs）"
      ]
    },
    {
      id: "ai-deploy",
      title: "模型部署与 MLOps",
      domain: "engineering",
      core: false,
      status: "unlearned",
      position: { x: 300, y: 600 },
      why: "训练好的模型不等于可用的产品。生产部署需要解决推理速度（量化、投机采样）、并发吞吐（vLLM 的 PagedAttention）、模型监控（漂移检测、幻觉率追踪）和版本管理。AI 系统的工程复杂度不低于传统软件。",
      problems: [
        "vLLM 的 PagedAttention 如何把 GPU 显存利用率从 40% 提升到 90%？",
        "INT4 量化如何在几乎不损失质量的情况下把模型体积缩小 4 倍？",
        "如何检测线上模型的输出质量在悄悄变差？（模型漂移）"
      ],
      prerequisites: ["AI 后端与 API 开发", "Linux 与 Docker 基础"],
      path: [
        "模型量化：GGUF（llama.cpp）、AWQ、GPTQ",
        "推理引擎：vLLM（高吞吐）、llama.cpp（本地部署）、TGI",
        "容器化部署：Dockerfile for GPU、NVIDIA Container Toolkit",
        "监控：LangSmith、Langfuse（trace 和 eval 平台）",
        "成本优化：批处理、缓存、路由到合适大小的模型"
      ],
      projects: [
        "用 vLLM 部署 LLaMA 3 8B 并做压测，对比和 Ollama 的吞吐量差异",
        "搭建 LangSmith 或 Langfuse 监控你的 AI 应用，追踪 latency/token 消耗/错误率"
      ],
      resources: [
        "vLLM 文档（https://docs.vllm.ai/，目前最主流的 LLM 推理引擎）",
        "llama.cpp（https://github.com/ggerganov/llama.cpp，本地部署大模型的最佳工具）",
        "Langfuse（https://langfuse.com/docs，开源 LLM 监控平台，自托管友好）",
        "《ML Engineering》Chip Huyen（https://www.oreilly.com/library/view/designing-machine-learning/9781098107956/，MLOps 最系统的书）"
      ]
    }
  ],
  edges: [
    { id: "e1", source: "ai-math", target: "ai-dl-foundation", kind: "dependency" },
    { id: "e2", source: "ai-python", target: "ai-dl-foundation", kind: "dependency" },
    { id: "e3", source: "ai-dl-foundation", target: "ai-transformer", kind: "dependency" },
    { id: "e4", source: "ai-transformer", target: "ai-prompt-rag", kind: "dependency" },
    { id: "e5", source: "ai-dl-foundation", target: "ai-pytorch", kind: "dependency" },
    { id: "e6", source: "ai-pytorch", target: "ai-finetune", kind: "dependency" },
    { id: "e7", source: "ai-transformer", target: "ai-finetune", kind: "dependency" },
    { id: "e8", source: "ai-prompt-rag", target: "ai-api-backend", kind: "related" },
    { id: "e9", source: "ai-api-backend", target: "ai-frontend", kind: "dependency" },
    { id: "e10", source: "ai-api-backend", target: "ai-deploy", kind: "dependency" },
    { id: "e11", source: "ai-finetune", target: "ai-deploy", kind: "related" }
  ]
};

// ─────────────────────────────────────────────
// 路线选择器
// ─────────────────────────────────────────────
export type MaopuRoute = Route;

export function routeForGoal(goal: string): MaopuRoute {
  const g = goal.toLowerCase();
  if (g.includes("ai") || g.includes("机器学习") || g.includes("深度学习") || g.includes("大模型") || g.includes("llm")) {
    return aiEngineerRoute;
  }
  if (g.includes("cs") || g.includes("自学") || g.includes("基础") || g.includes("csdiy") || g.includes("计算机科学")) {
    return csdiyRoute;
  }
  return defaultRoute;
}
