import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

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
      assertTextSize(body.text);
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

  if (extension === "xlsx") {
    return parseWorkbook(buffer, name);
  }

  if (extension === "xls") {
    throw new MaterialParseError("旧版 .xls 格式暂不解析，请另存为 .xlsx、CSV 或 TSV 后再上传。", 415);
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
  const { default: readXlsxFile } = await import("read-excel-file/universal");
  const input = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(input).set(buffer);
  const sheets = await readXlsxFile(input);
  const sections = sheets.slice(0, 6).map(({ sheet, data }) => {
    const rows = data.slice(0, 80);
    const table = rows
      .map((row) =>
        row
          .map((cell) => (cell instanceof Date ? cell.toISOString().slice(0, 10) : String(cell ?? "")))
          .join(" | ")
      )
      .join("\n");
    return [`# Sheet: ${sheet}`, table].join("\n");
  });
  const text = normalizeText(sections.join("\n\n")).slice(0, 16000);
  return {
    sourceName,
    sourceType: "excel",
    text: text || "未从 Excel 中读取到文本内容。",
    summary: `已解析 ${sheets.length} 个工作表，抽取前 ${Math.min(sheets.length, 6)} 个工作表的课程/表格内容。`,
    meta: { sheets: sheets.map(({ sheet }) => sheet) }
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

  await assertPublicHttpUrl(url);
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

async function assertPublicHttpUrl(rawUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new MaterialParseError("链接格式不正确，请使用完整的 http 或 https 地址。", 400);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new MaterialParseError("只支持解析 http 或 https 链接。", 400);
  }

  if (parsed.username || parsed.password) {
    throw new MaterialParseError("链接中不能包含用户名或密码。", 400);
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[(.*)\]$/, "$1");
  if (isBlockedHostname(hostname)) {
    throw new MaterialParseError("为保护部署环境，不能解析本机或内网地址。", 400);
  }

  if (isIP(hostname)) return;

  let addresses: Array<{ address: string }>;
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new MaterialParseError("无法解析该链接域名，请检查地址是否可访问。", 400);
  }

  if (addresses.length === 0 || addresses.some(({ address }) => isBlockedIp(address))) {
    throw new MaterialParseError("为保护部署环境，不能解析指向内网的链接。", 400);
  }
}

function isBlockedHostname(hostname: string) {
  return hostname === "localhost" || hostname.endsWith(".localhost") || isBlockedIp(hostname);
}

function isBlockedIp(address: string) {
  const version = isIP(address);
  if (version === 4) return isBlockedIpv4(address);
  if (version === 6) return isBlockedIpv6(address);
  return false;
}

function isBlockedIpv4(address: string) {
  const parts = address.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isBlockedIpv6(address: string) {
  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized === "::" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }
  if (!normalized.startsWith("::ffff:")) return false;
  return isBlockedIpv4(normalized.replace("::ffff:", ""));
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

function assertTextSize(text: string) {
  const maxBytes = readByteLimit("MATERIAL_MAX_TEXT_MB", 1);
  const bytes = Buffer.byteLength(text, "utf8");
  if (bytes <= maxBytes) return;
  throw new MaterialParseError(`粘贴内容超过 ${formatMb(maxBytes)}MB，请截取最关键的部分。`, 413);
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
