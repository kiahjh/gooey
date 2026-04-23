import { open } from "@tauri-apps/plugin-dialog";
import { create } from "zustand";
import {
  addWorkspace as addWorkspaceRecord,
  archiveSession as archiveSessionRecord,
  createSession as createSessionRecord,
  getSidebarState,
  selectSession as selectSessionRecord,
} from "../lib/backend";
import { getErrorMessage } from "../lib/errors";
import type { SidebarStateSnapshot, Workspace } from "../types/gooey";

type LoadStatus = "idle" | "loading" | "ready" | "error";

type GooeyStore = {
  status: LoadStatus;
  errorMessage: string | null;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeSessionId: string | null;
  collapsedWorkspaceIds: Record<string, boolean>;
  initialize(): Promise<void>;
  openWorkspace(): Promise<void>;
  createSession(workspaceId?: string): Promise<void>;
  archiveSession(sessionId: string): Promise<void>;
  selectSession(sessionId: string): Promise<void>;
  toggleWorkspaceCollapsed(workspaceId: string): void;
  toggleAllWorkspacesCollapsed(): void;
};

const syncSnapshot = (
  currentCollapsedState: Record<string, boolean>,
  snapshot: SidebarStateSnapshot,
) => {
  const nextCollapsedState = Object.fromEntries(
    snapshot.workspaces.map((workspace) => [
      workspace.id,
      currentCollapsedState[workspace.id] ?? false,
    ]),
  );

  return {
    workspaces: snapshot.workspaces,
    activeWorkspaceId: snapshot.activeWorkspaceId,
    activeSessionId: snapshot.activeSessionId,
    collapsedWorkspaceIds: nextCollapsedState,
    status: "ready" as const,
    errorMessage: null,
  };
};

const resolveWorkspaceId = (
  workspaces: Workspace[],
  activeWorkspaceId: string | null,
  requestedWorkspaceId?: string,
) => {
  if (requestedWorkspaceId) {
    return requestedWorkspaceId;
  }

  if (activeWorkspaceId) {
    return activeWorkspaceId;
  }

  return workspaces[0]?.id ?? null;
};

export const useGooeyStore = create<GooeyStore>((set, get) => ({
  status: "idle",
  errorMessage: null,
  workspaces: [],
  activeWorkspaceId: null,
  activeSessionId: null,
  collapsedWorkspaceIds: {},
  async initialize() {
    set((state) => ({
      status: state.workspaces.length === 0 ? "loading" : state.status,
      errorMessage: null,
    }));

    try {
      const snapshot = await getSidebarState();
      set((state) => syncSnapshot(state.collapsedWorkspaceIds, snapshot));
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load Gooey data.");
      set({ status: "error", errorMessage: message });
    }
  },
  async openWorkspace() {
    try {
      const selectedPath = await open({
        directory: true,
        multiple: false,
        title: "Open Project Folder",
      });

      if (!selectedPath || Array.isArray(selectedPath)) {
        return;
      }

      set({ errorMessage: null });

      const snapshot = await addWorkspaceRecord(selectedPath);
      set((state) => syncSnapshot(state.collapsedWorkspaceIds, snapshot));
    } catch (error) {
      const message = getErrorMessage(error, "Failed to open the project.");
      set({ status: "error", errorMessage: message });
    }
  },
  async createSession(requestedWorkspaceId) {
    const workspaceId = resolveWorkspaceId(
      get().workspaces,
      get().activeWorkspaceId,
      requestedWorkspaceId,
    );

    if (!workspaceId) {
      set({
        errorMessage: "Open a project before creating a conversation.",
        status: "error",
      });
      return;
    }

    try {
      set({ errorMessage: null });
      const snapshot = await createSessionRecord(workspaceId);
      set((state) => syncSnapshot(state.collapsedWorkspaceIds, snapshot));
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Failed to create the conversation.",
      );
      set({ status: "error", errorMessage: message });
    }
  },
  async archiveSession(sessionId) {
    try {
      set({ errorMessage: null });
      const snapshot = await archiveSessionRecord(sessionId);
      set((state) => syncSnapshot(state.collapsedWorkspaceIds, snapshot));
    } catch (error) {
      const message = getErrorMessage(error, "Failed to archive the conversation.");
      set({ status: "error", errorMessage: message });
    }
  },
  async selectSession(sessionId) {
    try {
      set({ errorMessage: null });
      const snapshot = await selectSessionRecord(sessionId);
      set((state) => syncSnapshot(state.collapsedWorkspaceIds, snapshot));
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Failed to select the conversation.",
      );
      set({ status: "error", errorMessage: message });
    }
  },
  toggleWorkspaceCollapsed(workspaceId) {
    set((state) => ({
      collapsedWorkspaceIds: {
        ...state.collapsedWorkspaceIds,
        [workspaceId]: !state.collapsedWorkspaceIds[workspaceId],
      },
    }));
  },
  toggleAllWorkspacesCollapsed() {
    set((state) => {
      const shouldCollapseAll = !state.workspaces.every(
        (workspace) => state.collapsedWorkspaceIds[workspace.id],
      );

      return {
        collapsedWorkspaceIds: Object.fromEntries(
          state.workspaces.map((workspace) => [workspace.id, shouldCollapseAll]),
        ),
      };
    });
  },
}));
