const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/** 默认请求超时时间（毫秒） */
const DEFAULT_TIMEOUT = 15_000; // 15 秒
/** Memory save/delete timeout — file + optional 0G KV write can be slow */
export const MEMORY_TIMEOUT = 30_000; // 30 秒

/** Chat 推理专用超时 — TEE inference 可能需要 60s+ */
export const CHAT_TIMEOUT = 90_000; // 90 秒

/** ── 全局认证状态 ── */
let _walletAddress: string | null = null;
let _jwt: string | null = null;

export function setApiWalletAddress(address: string | null | undefined) {
  _walletAddress = address?.toLowerCase() ?? null;
}

export function getApiWalletAddress(): string | null {
  return _walletAddress;
}

/** Set the JWT returned from /api/auth/verify */
export function setApiJwt(token: string | null) {
  _jwt = token;
}

export function getApiJwt(): string | null {
  return _jwt;
}

function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (_jwt) {
    // Prefer JWT Bearer token — provides real signature-based auth
    headers["Authorization"] = `Bearer ${_jwt}`;
  }
  if (_walletAddress) {
    // Always include x-wallet-address for backwards compat with routes
    // that still read it directly (chatbot webhook, explore, etc.)
    headers["x-wallet-address"] = _walletAddress;
  }
  return headers;
}

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
    headers: buildAuthHeaders(),
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
    headers: buildAuthHeaders(),
    body: JSON.stringify(body),
    signal: createTimeoutSignal(timeoutMs),
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T>(
  path: string,
  body?: unknown,
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<T> {
  const url = buildUrl(path);
  const res = await fetch(url, {
    method: "DELETE",
    headers: buildAuthHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal: createTimeoutSignal(timeoutMs),
  });
  return handleResponse<T>(res);
}

export async function apiPut<T>(
  path: string,
  body: unknown,
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<T> {
  const url = buildUrl(path);
  const res = await fetch(url, {
    method: "PUT",
    headers: buildAuthHeaders(),
    body: JSON.stringify(body),
    signal: createTimeoutSignal(timeoutMs),
  });
  return handleResponse<T>(res);
}
