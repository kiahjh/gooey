import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import { create } from "zustand";
import {
  addWorkspace as addWorkspaceRecord,
  archiveSession as archiveSessionRecord,
  createSession as createSessionRecord,
  getSidebarState,
  selectSession as selectSessionRecord,
  sendPrompt as sendPromptRecord,
} from "../lib/backend";
import { getErrorMessage } from "../lib/errors";
import type {
  Session,
  SessionEvent,
  SidebarStateSnapshot,
  Workspace,
} from "../types/gooey";
import type { AppScreen, SettingsSection } from "../types/settings";

type LoadStatus = "idle" | "loading" | "ready" | "error";

type GooeyStore = {
  status: LoadStatus;
  errorMessage: string | null;
  currentScreen: AppScreen;
  activeSettingsSection: SettingsSection;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeSessionId: string | null;
  collapsedWorkspaceIds: Record<string, boolean>;
  initialize(): Promise<void>;
  openSettings(section?: SettingsSection): void;
  closeSettings(): void;
  selectSettingsSection(section: SettingsSection): void;
  openWorkspace(): Promise<void>;
  createSession(workspaceId?: string): Promise<void>;
  archiveSession(sessionId: string): Promise<void>;
  selectSession(sessionId: string): Promise<void>;
  sendPrompt(input: { modelId: string; prompt: string; sessionId?: string | null }): Promise<void>;
  toggleWorkspaceCollapsed(workspaceId: string): void;
  toggleAllWorkspacesCollapsed(): void;
};

type PromptStreamEvent =
  | {
      type: "session";
      session: Session;
    }
  | {
      type: "assistant_delta";
      delta: string;
      runId: string;
      sequenceNumber: number | null;
      sessionId: string;
    }
  | {
      type: "completed";
      session: Session;
    }
  | {
      type: "failed";
      session: Session;
    };

let promptStreamUnlisten: (() => void) | null = null;
let promptStreamListenPromise: Promise<void> | null = null;
const appliedStreamDeltaIds = new Set<string>();

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

const replaceSession = (workspaces: Workspace[], nextSession: Session) =>
  workspaces.map((workspace) =>
    workspace.id === nextSession.workspaceId
      ? {
          ...workspace,
          updatedAt: nextSession.updatedAt,
          lastOpenedAt: nextSession.updatedAt,
          sessions: workspace.sessions
            .map((session) =>
              session.id === nextSession.id ? nextSession : session,
            )
            .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
        }
      : workspace,
  );

const appendAssistantDelta = (
  workspaces: Workspace[],
  sessionId: string,
  runId: string,
  delta: string,
  sequenceNumber: number | null,
) =>
  workspaces.map((workspace) => ({
    ...workspace,
    sessions: workspace.sessions.map((session) => {
      if (session.id !== sessionId) return session;

      if (sequenceNumber !== null) {
        const deltaId = `${sessionId}:${runId}:${sequenceNumber}`;
        if (appliedStreamDeltaIds.has(deltaId)) return session;
        appliedStreamDeltaIds.add(deltaId);
      }

      const streamEventId = `stream_${runId}`;
      const existingEvent = session.events.find(
        (event) => event.type === "assistant" && event.runId === runId,
      );
      let events: SessionEvent[];

      if (existingEvent?.type === "assistant") {
        events = session.events.map((event) =>
          event.type === "assistant" && event.runId === runId
            ? {
                ...event,
                streamParts: [...(event.streamParts ?? [event.text]), delta],
                text: event.text + delta,
              }
            : event,
        );
      } else {
        events = [
          ...session.events,
          {
            id: streamEventId,
            type: "assistant",
            createdAt: new Date().toISOString(),
            model: "",
            provider: "openai",
            runId,
            streamParts: [delta],
            text: delta,
          },
        ];
      }

      return {
        ...session,
        events,
      };
    }),
  }));

export const useGooeyStore = create<GooeyStore>((set, get) => ({
  status: "idle",
  errorMessage: null,
  currentScreen: "chat",
  activeSettingsSection: "providers",
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
      if (!promptStreamUnlisten && !promptStreamListenPromise) {
        promptStreamListenPromise = listen<PromptStreamEvent>(
          "gooey://prompt-stream",
          (event) => {
            const streamEvent = event.payload;

            if (
              streamEvent.type === "session" ||
              streamEvent.type === "completed" ||
              streamEvent.type === "failed"
            ) {
              set((state) => ({
                workspaces: replaceSession(state.workspaces, streamEvent.session),
                activeWorkspaceId: streamEvent.session.workspaceId,
                activeSessionId: streamEvent.session.id,
                status: "ready",
                errorMessage: null,
              }));
              return;
            }

            set((state) => ({
              workspaces: appendAssistantDelta(
                state.workspaces,
                streamEvent.sessionId,
                streamEvent.runId,
                streamEvent.delta,
                streamEvent.sequenceNumber,
              ),
            }));
          },
        ).then((unlisten) => {
          promptStreamUnlisten = unlisten;
          promptStreamListenPromise = null;
        });
      }

      if (promptStreamListenPromise) {
        await promptStreamListenPromise;
      }

      const snapshot = await getSidebarState();
      set((state) => syncSnapshot(state.collapsedWorkspaceIds, snapshot));
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load Gooey data.");
      set({ status: "error", errorMessage: message });
    }
  },
  openSettings(section = "providers") {
    set({
      currentScreen: "settings",
      activeSettingsSection: section,
      errorMessage: null,
    });
  },
  closeSettings() {
    set({
      currentScreen: "chat",
      errorMessage: null,
    });
  },
  selectSettingsSection(section) {
    set({
      activeSettingsSection: section,
      errorMessage: null,
    });
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
  async sendPrompt({ modelId, prompt, sessionId }) {
    const targetSessionId = sessionId ?? get().activeSessionId;
    const trimmedPrompt = prompt.trim();

    if (!targetSessionId || !trimmedPrompt) {
      set({
        errorMessage: "Create a conversation before sending a message.",
        status: "error",
      });
      return;
    }

    try {
      const now = new Date().toISOString();
      const optimisticEvent = {
        id: `optimistic_${crypto.randomUUID()}`,
        type: "user" as const,
        createdAt: now,
        text: trimmedPrompt,
      };
      set((state) => ({
        errorMessage: null,
        workspaces: state.workspaces.map((workspace) => ({
          ...workspace,
          sessions: workspace.sessions.map((session) =>
            session.id === targetSessionId
              ? {
                  ...session,
                  title:
                    session.title === "Untitled"
                      ? titleFromPrompt(trimmedPrompt)
                      : session.title,
                  status: "working",
                  updatedAt: now,
                  events: [...session.events, optimisticEvent],
                }
              : session,
          ),
        })),
      }));
      const nextSession = await sendPromptRecord({
        modelId,
        prompt: trimmedPrompt,
        sessionId: targetSessionId,
      });
      set((state) => ({
        workspaces: replaceSession(state.workspaces, nextSession),
        activeWorkspaceId: nextSession.workspaceId,
        activeSessionId: nextSession.id,
        status: "ready",
        errorMessage: null,
      }));
    } catch (error) {
      const message = getErrorMessage(error, "Failed to send the message.");
      set((state) => ({
        status: "error",
        errorMessage: message,
        workspaces: state.workspaces.map((workspace) => ({
          ...workspace,
          sessions: workspace.sessions.map((session) =>
            session.id === targetSessionId
              ? { ...session, status: "idle" }
              : session,
          ),
        })),
      }));
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

const titleFromPrompt = (prompt: string) => {
  const collapsed = prompt.replace(/\s+/g, " ").trim();
  if (collapsed.length <= 42) return collapsed;
  return `${collapsed.slice(0, 39).trimEnd()}...`;
};
