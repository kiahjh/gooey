import { createServer } from "node:http"
import { authFile } from "./paths"
import { readJsonOrDefault, writeJson } from "./json-store"
import type { ConfiguredProviderModel, ProviderConnectionStatus } from "./types"

const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann"
const ISSUER = "https://auth.openai.com"
const OAUTH_PORT = 1455
const AUTH_TIMEOUT_MS = 5 * 60 * 1000

type TokenResponse = {
  access_token: string
  expires_in?: number
  id_token?: string
  refresh_token: string
}

type ChatgptSubscriptionAuth = {
  type: "chatgptSubscription"
  access: string
  refresh: string
  expiresAt: string
  accountId?: string
}

type AuthFile = {
  openai?: ChatgptSubscriptionAuth
}

type PkceCodes = {
  challenge: string
  verifier: string
}

export async function getOpenAIConnectionStatus(): Promise<ProviderConnectionStatus> {
  return openAIStatus()
}

export async function connectOpenAIChatGPTAccount(): Promise<ProviderConnectionStatus> {
  const pkce = await generatePkce()
  const state = generateState()
  const redirectUri = `http://localhost:${OAUTH_PORT}/auth/callback`
  const callbackPromise = waitForOAuthCallback(state)
  const authorizationUrl = buildAuthorizationUrl(redirectUri, pkce, state)

  await openExternalUrl(authorizationUrl)

  const code = await callbackPromise
  const tokens = await exchangeCodeForTokens(code, redirectUri, pkce)
  await persistOpenAISubscription(tokens)
  return openAIStatus()
}

export async function disconnectOpenAIChatGPTAccount(): Promise<ProviderConnectionStatus> {
  const auth = await readAuthFile()
  delete auth.openai
  await writeAuthFile(auth)
  return openAIStatus()
}

export async function refreshOpenAIChatGPTAccount(): Promise<ProviderConnectionStatus> {
  await refreshOpenAIAccessTokenIfNeeded()
  return openAIStatus()
}

export async function getConfiguredProviderModels(): Promise<ConfiguredProviderModel[]> {
  await refreshOpenAIAccessTokenIfNeeded()
  const auth = await readAuthFile()
  return auth.openai ? openAIChatGPTSubscriptionModels() : []
}

export async function getOpenAIAccess(): Promise<ChatgptSubscriptionAuth> {
  await refreshOpenAIAccessTokenIfNeeded()
  const auth = await readAuthFile()
  if (!auth.openai) {
    throw new Error("Connect an OpenAI ChatGPT account before chatting.")
  }
  return auth.openai
}

async function openAIStatus(): Promise<ProviderConnectionStatus> {
  const auth = await readAuthFile()

  if (!auth.openai) {
    return {
      accountId: null,
      connected: false,
      expiresAt: null,
      method: null,
      provider: "openai",
    }
  }

  return {
    accountId: auth.openai.accountId ?? null,
    connected: true,
    expiresAt: auth.openai.expiresAt,
    method: "chatgptSubscription",
    provider: "openai",
  }
}

async function persistOpenAISubscription(tokens: TokenResponse): Promise<void> {
  const auth = await readAuthFile()
  auth.openai = {
    type: "chatgptSubscription",
    access: tokens.access_token,
    refresh: tokens.refresh_token,
    expiresAt: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
    accountId: extractAccountId(tokens),
  }
  await writeAuthFile(auth)
}

async function refreshOpenAIAccessTokenIfNeeded(): Promise<void> {
  const auth = await readAuthFile()
  const openai = auth.openai
  if (!openai) return

  if (new Date(openai.expiresAt).getTime() > Date.now() + 2 * 60 * 1000) return

  const tokens = await refreshAccessToken(openai.refresh)
  auth.openai = {
    type: "chatgptSubscription",
    access: tokens.access_token,
    refresh: tokens.refresh_token,
    expiresAt: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
    accountId: extractAccountId(tokens) ?? openai.accountId,
  }
  await writeAuthFile(auth)
}

function openAIChatGPTSubscriptionModels(): ConfiguredProviderModel[] {
  return [
    ["openai/gpt-5.4", "GPT-5.4"],
    ["openai/gpt-5.4-mini", "GPT-5.4 Mini"],
    ["openai/gpt-5.3-codex", "GPT-5.3 Codex"],
    ["openai/gpt-5.2", "GPT-5.2"],
    ["openai/gpt-5.2-codex", "GPT-5.2 Codex"],
    ["openai/gpt-5.1-codex", "GPT-5.1 Codex"],
    ["openai/gpt-5.1-codex-max", "GPT-5.1 Codex Max"],
    ["openai/gpt-5.1-codex-mini", "GPT-5.1 Codex Mini"],
  ].map(([id, label]) => ({
    id,
    label,
    provider: "openai",
    providerLabel: "OpenAI",
  }))
}

async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  pkce: PkceCodes,
): Promise<TokenResponse> {
  const response = await fetch(`${ISSUER}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: CLIENT_ID,
      code_verifier: pkce.verifier,
    }),
  })

  if (!response.ok) throw new Error(`Token exchange failed with status ${response.status}`)
  return response.json() as Promise<TokenResponse>
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch(`${ISSUER}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    }),
  })

  if (!response.ok) throw new Error(`Token refresh failed with status ${response.status}`)
  return response.json() as Promise<TokenResponse>
}

function buildAuthorizationUrl(redirectUri: string, pkce: PkceCodes, state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "openid profile email offline_access",
    code_challenge: pkce.challenge,
    code_challenge_method: "S256",
    id_token_add_organizations: "true",
    codex_cli_simplified_flow: "true",
    state,
    originator: "opencode",
  })
  return `${ISSUER}/oauth/authorize?${params.toString()}`
}

function waitForOAuthCallback(expectedState: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? "/", `http://localhost:${OAUTH_PORT}`)

      if (url.pathname !== "/auth/callback") {
        response.writeHead(404)
        response.end("Not found")
        return
      }

      const error = url.searchParams.get("error")
      if (error) {
        cleanup()
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" })
        response.end(htmlError)
        reject(new Error(url.searchParams.get("error_description") ?? error))
        return
      }

      const code = url.searchParams.get("code")
      const state = url.searchParams.get("state")
      if (!code || state !== expectedState) {
        cleanup()
        response.writeHead(400, { "content-type": "text/html; charset=utf-8" })
        response.end(htmlError)
        reject(new Error(code ? "OAuth state mismatch. Please try again." : "Missing authorization code."))
        return
      }

      cleanup()
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" })
      response.end(htmlSuccess)
      resolve(code)
    })

    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error("Timed out waiting for ChatGPT authorization."))
    }, AUTH_TIMEOUT_MS)

    function cleanup() {
      clearTimeout(timeout)
      server.close()
    }

    server.once("error", (error) => {
      cleanup()
      reject(error)
    })
    server.listen(OAUTH_PORT, "127.0.0.1")
  })
}

async function generatePkce(): Promise<PkceCodes> {
  const verifier = generateRandomString(64)
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
  return {
    verifier,
    challenge: base64UrlEncode(digest),
  }
}

function generateRandomString(length: number): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (byte) => characters[byte % characters.length]).join("")
}

function generateState(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)).buffer)
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64url")
}

function extractAccountId(tokens: TokenResponse): string | undefined {
  return (
    (tokens.id_token && extractAccountIdFromJwt(tokens.id_token)) ??
    extractAccountIdFromJwt(tokens.access_token)
  )
}

function extractAccountIdFromJwt(token: string): string | undefined {
  const payload = token.split(".")[1]
  if (!payload) return undefined

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      chatgpt_account_id?: string
      "https://api.openai.com/auth"?: { chatgpt_account_id?: string }
      organizations?: Array<{ id?: string }>
    }
    return (
      claims.chatgpt_account_id ??
      claims["https://api.openai.com/auth"]?.chatgpt_account_id ??
      claims.organizations?.[0]?.id
    )
  } catch {
    return undefined
  }
}

async function openExternalUrl(url: string): Promise<void> {
  const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open"
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url]
  const processRef = Bun.spawn([command, ...args], {
    stderr: "ignore",
    stdout: "ignore",
  })
  const exitCode = await processRef.exited
  if (exitCode !== 0) throw new Error("Failed to open browser.")
}

function readAuthFile(): Promise<AuthFile> {
  return readJsonOrDefault(authFile(), {})
}

function writeAuthFile(value: AuthFile): Promise<void> {
  return writeJson(authFile(), value, 0o600)
}

const htmlSuccess = `<!doctype html><html><head><meta charset="utf-8"><title>Gooey authorization complete</title></head><body style="align-items:center;background:#1d1a17;color:#f2eeea;display:flex;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;height:100vh;justify-content:center;margin:0"><main style="max-width:420px;padding:32px;text-align:center"><h1>Connected to Gooey</h1><p style="color:#a8a098">You can close this window and return to settings.</p></main></body></html>`

const htmlError = `<!doctype html><html><head><meta charset="utf-8"><title>Gooey authorization failed</title></head><body style="align-items:center;background:#1d1a17;color:#f2eeea;display:flex;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;height:100vh;justify-content:center;margin:0"><main style="max-width:420px;padding:32px;text-align:center"><h1>Connection failed</h1><p style="color:#a8a098">Return to Gooey and try connecting again.</p></main></body></html>`
