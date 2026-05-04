import {
  addWorkspace,
  archiveSession,
  createSession,
  getSidebarState,
  selectSession,
} from "./workspace-store"
import {
  connectOpenAIChatGPTAccount,
  disconnectOpenAIChatGPTAccount,
  getConfiguredProviderModels,
  getOpenAIConnectionStatus,
  refreshOpenAIChatGPTAccount,
} from "./provider-auth"
import { sendPrompt } from "./chat"
import type { SendPromptInput } from "./types"

type CommandHandler = (params: unknown) => Promise<unknown>

const requireStringParam = (
  params: unknown,
  key: string,
  fallbackName = key,
): string => {
  const value = (params as Record<string, unknown> | undefined)?.[key]
  if (typeof value !== "string" || !value) {
    throw new Error(`Missing ${fallbackName}.`)
  }
  return value
}

const commandHandlers: Record<string, CommandHandler> = {
  get_sidebar_state: () => getSidebarState(),
  add_workspace: (params) => addWorkspace(requireStringParam(params, "path", "workspace path")),
  create_session: (params) => createSession(requireStringParam(params, "workspaceId")),
  archive_session: (params) => archiveSession(requireStringParam(params, "sessionId")),
  select_session: (params) => selectSession(requireStringParam(params, "sessionId")),
  get_openai_connection_status: () => getOpenAIConnectionStatus(),
  connect_openai_chatgpt_account: () => connectOpenAIChatGPTAccount(),
  disconnect_openai_chatgpt_account: () => disconnectOpenAIChatGPTAccount(),
  refresh_openai_chatgpt_account: () => refreshOpenAIChatGPTAccount(),
  get_configured_provider_models: () => getConfiguredProviderModels(),
  send_prompt: (params) => sendPrompt(params as SendPromptInput),
}

export async function dispatchRuntimeCommand(
  method: string,
  params?: unknown,
): Promise<unknown> {
  const handler = commandHandlers[method]
  if (!handler) throw new Error(`Unknown runtime command: ${method}`)
  return handler(params)
}
