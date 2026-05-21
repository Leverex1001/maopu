import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type ParseMaterialResponse = {
  sourceName: string;
  sourceType: string;
  text: string;
  summary: string;
  meta?: Record<string, string | number | string[]>;
};

type GithubRepository = {
  default_branch?: string;
};

type GithubTree = {
  tree?: Array<{
    path?: string;
    type?: string;
  }>;
};

type GithubReadme = {
  content?: string;
  encoding?: string;
  name?: string;
};

class MaterialParseError extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message);
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      assertFileSize(file);
      const parsed = await parseFile(file);
      return NextResponse.json(parsed);
    }

    const body = (await request.json().catch(() => ({}))) as { url?: string; text?: string };
    if (body.url?.trim()) {
      return NextResponse.json(await parseUrl(body.url.trim()));
    }

    if (body.text?.trim()) {
      return NextResponse.json(parsePlainText(body.text, "粘贴资料"));
    }

    return NextResponse.json({ error: "No material provided" }, { status: 400 });
  } catch (error) {
    console.warn("Material parse failed:", error instanceof Error ? error.message : "unknown error");
    const status = error instanceof MaterialParseError ? error.status : 500;
    return NextResponse.json(
      {
        error: "Material parse failed",
        message: error instanceof Error ? error.message : "unknown error"
      },
      { status }
    );
  }
}

async function parseFile(file: File): Promise<ParseMaterialResponse> {
  const name = file.name || "untitled";
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  const buffer = Buffer.from(await file.arrayBuffer());

  if (extension === "pdf") {
    return parsePdf(buffer, name);
  }

  if (["xlsx", "xls"].includes(extension)) {
    return parseWorkbook(buffer, name);
  }

  if (["txt", "md", "markdown", "csv", "tsv", "json"].includes(extension) || file.type.startsWith("text/")) {
    return parsePlainText(buffer.toString("utf8"), name, extension || "text");
  }

  return {
    sourceName: name,
    sourceType: "unknown-file",
    text: `文件名：${name}\n大小：${Math.round(file.size / 1024)}KB\n暂不支持直接解析该文件类型，请补充资料说明。`,
    summary: "暂不支持的文件类型，已保留文件名和大小。",
    meta: { sizeKb: Math.round(file.size / 1024), mimeType: file.type || "unknown" }
  };
}

async function parsePdf(buffer: Buffer, sourceName: string): Promise<ParseMaterialResponse> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = normalizeText(result.text).slice(0, 16000);
    return {
      sourceName,
      sourceType: "pdf",
      text,
      summary: summarizeText(text, "PDF"),
      meta: { characters: text.length }
    };
  } finally {
    await parser.destroy();
  }
}

async function parseWorkbook(buffer: Buffer, sourceName: string): Promise<ParseMaterialResponse> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sections = workbook.SheetNames.slice(0, 6).map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }).slice(0, 80);
    const csv = XLSX.utils.sheet_to_csv(sheet).split("\n").slice(0, 120).join("\n");
    return [`# Sheet: ${sheetName}`, rows.length ? JSON.stringify(rows.slice(0, 20), null, 2) : csv].join("\n");
  });
  const text = normalizeText(sections.join("\n\n")).slice(0, 16000);
  return {
    sourceName,
    sourceType: "excel",
    text,
    summary: `已解析 ${workbook.SheetNames.length} 个工作表，抽取前 ${Math.min(workbook.SheetNames.length, 6)} 个工作表的课程/表格内容。`,
    meta: { sheets: workbook.SheetNames }
  };
}

function parsePlainText(text: string, sourceName: string, sourceType = "text"): ParseMaterialResponse {
  const normalized = normalizeText(text).slice(0, 16000);
  return {
    sourceName,
    sourceType,
    text: normalized,
    summary: summarizeText(normalized, sourceType),
    meta: { characters: normalized.length }
  };
}

async function parseUrl(url: string): Promise<ParseMaterialResponse> {
  const github = parseGithubUrl(url);
  if (github) {
    return parseGithubRepository(github.owner, github.repo);
  }

  const response = await fetch(url, {
    headers: { "User-Agent": "maopu-material-parser" },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) {
    throw new Error(`URL fetch failed: ${response.status}`);
  }
  assertUrlSize(response);

  const html = await response.text();
  const text = normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
  ).slice(0, 12000);

  return {
    sourceName: url,
    sourceType: "url",
    text,
    summary: summarizeText(text, "网页"),
    meta: { url }
  };
}

function assertFileSize(file: File) {
  const maxBytes = readByteLimit("MATERIAL_MAX_FILE_MB", 8);
  if (file.size <= maxBytes) return;
  throw new MaterialParseError(`文件超过 ${formatMb(maxBytes)}MB，请先压缩或截取核心内容。`, 413);
}

function assertUrlSize(response: Response) {
  const maxBytes = readByteLimit("MATERIAL_MAX_URL_MB", 2);
  const contentLength = Number.parseInt(response.headers.get("content-length") ?? "", 10);
  if (!Number.isFinite(contentLength) || contentLength <= maxBytes) return;
  throw new MaterialParseError(`网页内容超过 ${formatMb(maxBytes)}MB，请改用摘要或核心片段。`, 413);
}

function readByteLimit(name: string, fallbackMb: number) {
  const value = Number.parseFloat(process.env[name] ?? "");
  const mb = Number.isFinite(value) && value > 0 ? value : fallbackMb;
  return Math.round(mb * 1024 * 1024);
}

function formatMb(bytes: number) {
  return Math.round((bytes / 1024 / 1024) * 10) / 10;
}

async function parseGithubRepository(owner: string, repo: string): Promise<ParseMaterialResponse> {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "maopu-material-parser"
  };
  const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers, signal: AbortSignal.timeout(15000) });
  if (!repoResponse.ok) {
    throw new Error(`GitHub repo fetch failed: ${repoResponse.status}`);
  }
  const repoInfo = (await repoResponse.json()) as GithubRepository;
  const branch = repoInfo.default_branch || "main";

  const [readmeText, treeText] = await Promise.all([fetchGithubReadme(owner, repo, headers), fetchGithubTree(owner, repo, branch, headers)]);
  const text = normalizeText(
    [`GitHub 仓库：${owner}/${repo}`, readmeText ? `README:\n${readmeText}` : "README: 未找到", treeText ? `目录结构:\n${treeText}` : ""].join("\n\n")
  ).slice(0, 16000);

  return {
    sourceName: `${owner}/${repo}`,
    sourceType: "github",
    text,
    summary: "已抓取 GitHub README 和仓库目录结构，可用于生成项目学习路线。",
    meta: { owner, repo, branch }
  };
}

async function fetchGithubReadme(owner: string, repo: string, headers: Record<string, string>) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) return "";
  const payload = (await response.json()) as GithubReadme;
  if (!payload.content) return "";
  const decoded = Buffer.from(payload.content, payload.encoding === "base64" ? "base64" : "utf8").toString("utf8");
  return decoded.slice(0, 10000);
}

async function fetchGithubTree(owner: string, repo: string, branch: string, headers: Record<string, string>) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
    headers,
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) return "";
  const payload = (await response.json()) as GithubTree;
  return (payload.tree ?? [])
    .filter((item) => item.path && !item.path.includes("node_modules") && !item.path.includes(".git"))
    .slice(0, 120)
    .map((item) => `${item.type === "tree" ? "dir " : "file"} ${item.path}`)
    .join("\n");
}

function parseGithubUrl(url: string) {
  const match = url.match(/^https?:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, "")
  };
}

function summarizeText(text: string, label: string) {
  if (!text.trim()) return `${label} 内容为空。`;
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return `已解析 ${label}，抽取 ${text.length} 个字符、${lines.length} 行文本。`;
}

function normalizeText(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\t/g, " ").replace(/[ \u00a0]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
