export type SessionEvent = {
  type: string;
};

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
