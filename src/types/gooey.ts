export type UserSessionEvent = {
  id: string;
  type: "user";
  createdAt: string;
  text: string;
};

export type AssistantSessionEvent = {
  id: string;
  type: "assistant";
  createdAt: string;
  model: string;
  provider: "openai";
  runId: string;
  streamParts?: string[];
  text: string;
};

export type SystemSessionEvent = {
  id: string;
  type: "system";
  createdAt: string;
  level: "error" | "info";
  runId?: string;
  text: string;
};

export type SessionEvent =
  | AssistantSessionEvent
  | SystemSessionEvent
  | UserSessionEvent;

export type SessionStatus = "idle" | "unread" | "working";

export type Session = {
  id: string;
  workspaceId: string;
  title: string;
  status: SessionStatus;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  events: SessionEvent[];
};

export type Workspace = {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
  sessions: Session[];
};

export type SidebarStateSnapshot = {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeSessionId: string | null;
};
