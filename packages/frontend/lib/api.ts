const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/** 默认请求超时时间（毫秒） */
const DEFAULT_TIMEOUT = 15_000; // 15 秒

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** 创建一个带超时的 AbortSignal */
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  /* Node 16+ / 现代浏览器支持 AbortSignal.timeout */
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(timeoutMs);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

/** 构建完整 URL，兼容相对路径（如 /api）和绝对路径 */
function buildUrl(path: string, params?: Record<string, string>): string {
  let fullUrl: URL;
  const base = `${API_BASE}${path}`;

  if (base.startsWith("http")) {
    // 绝对 URL
    fullUrl = new URL(base);
  } else {
    // 相对 URL（如 /api/explore/agents）— 需要 origin 作为 base
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    fullUrl = new URL(base, origin);
  }

  if (params) {
    Object.entries(params).forEach(([k, v]) => fullUrl.searchParams.set(k, v));
  }
  return fullUrl.toString();
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`;
    try {
      const errData = await res.json();
      errorMsg = errData.message || errData.error || errorMsg;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  const json = await res.json() as ApiEnvelope<T> | T;

  // Unwrap { success, data } envelope if present
  if (json && typeof json === "object" && "success" in json && "data" in json) {
    return (json as ApiEnvelope<T>).data as T;
  }

  return json as T;
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string>,
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<T> {
  const url = buildUrl(path, params);
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: createTimeoutSignal(timeoutMs),
  });
  return handleResponse<T>(res);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<T> {
  const url = buildUrl(path);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: createTimeoutSignal(timeoutMs),
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T>(
  path: string,
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<T> {
  const url = buildUrl(path);
  const res = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    signal: createTimeoutSignal(timeoutMs),
  });
  return handleResponse<T>(res);
}

