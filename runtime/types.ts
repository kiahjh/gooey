export type SessionEvent =
  | {
      id: string
      type: "user"
      createdAt: string
      text: string
    }
  | {
      id: string
      type: "assistant"
      createdAt: string
      model: string
      provider: "openai"
      runId: string
      text: string
    }
  | {
      id: string
      type: "system"
      createdAt: string
      level: "error" | "info"
      runId?: string
      text: string
    }

export type SessionStatus = "idle" | "unread" | "working"

export type Session = {
  id: string
  workspaceId: string
  title: string
  status: SessionStatus
  archived: boolean
  createdAt: string
  updatedAt: string
  events: SessionEvent[]
}

export type Workspace = {
  id: string
  name: string
  path: string
  createdAt: string
  updatedAt: string
  lastOpenedAt: string
  sessions: Session[]
}

export type WorkspaceRecord = Omit<Workspace, "sessions">

export type SidebarStateSnapshot = {
  workspaces: Workspace[]
  activeWorkspaceId: string | null
  activeSessionId: string | null
}

export type WorkspaceIndex = {
  activeWorkspaceId: string | null
  activeSessionId: string | null
  workspaces: WorkspaceRecord[]
}

export type ProviderConnectionStatus = {
  accountId: string | null
  connected: boolean
  expiresAt: string | null
  method: "chatgptSubscription" | null
  provider: "openai"
}

export type ConfiguredProviderModel = {
  id: string
  label: string
  provider: "openai"
  providerLabel: "OpenAI"
}

export type SendPromptInput = {
  modelId: string
  prompt: string
  sessionId: string
}

export type RuntimeRequest = {
  id: string
  method: string
  params?: unknown
}

export type RuntimeSuccessResponse = {
  id: string
  ok: true
  result: unknown
}

export type RuntimeErrorResponse = {
  id: string
  ok: false
  error: string
}

export type RuntimeResponse = RuntimeSuccessResponse | RuntimeErrorResponse
