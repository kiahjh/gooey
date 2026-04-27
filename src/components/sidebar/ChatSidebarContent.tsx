import React from "react";
import { PenSquareIcon, Settings2Icon } from "lucide-react";
import { useGooeyStore } from "../../state/useGooeyStore";
import ProjectsSection from "./ProjectsSection";
import MainSidebarButton from "../ui/MainSidebarButton";

const ChatSidebarContent: React.FC = () => {
  const workspaces = useGooeyStore((state) => state.workspaces);
  const activeWorkspaceId = useGooeyStore((state) => state.activeWorkspaceId);
  const activeSessionId = useGooeyStore((state) => state.activeSessionId);
  const collapsedWorkspaceIds = useGooeyStore(
    (state) => state.collapsedWorkspaceIds,
  );
  const createSession = useGooeyStore((state) => state.createSession);
  const archiveSession = useGooeyStore((state) => state.archiveSession);
  const openWorkspace = useGooeyStore((state) => state.openWorkspace);
  const openSettings = useGooeyStore((state) => state.openSettings);
  const selectSession = useGooeyStore((state) => state.selectSession);
  const toggleWorkspaceCollapsed = useGooeyStore(
    (state) => state.toggleWorkspaceCollapsed,
  );
  const toggleAllProjects = useGooeyStore(
    (state) => state.toggleAllWorkspacesCollapsed,
  );
  const fallbackWorkspaceId = activeWorkspaceId ?? workspaces[0]?.id ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MainSidebarButton
        icon={PenSquareIcon}
        label="New chat"
        kbd="⌘N"
        onClick={() => {
          if (fallbackWorkspaceId) {
            void createSession(fallbackWorkspaceId);
          }
        }}
        disabled={!fallbackWorkspaceId}
      />
      <MainSidebarButton
        icon={Settings2Icon}
        label="Settings"
        kbd="⌘,"
        onClick={() => openSettings()}
      />
      <ProjectsSection
        workspaces={workspaces}
        activeSessionId={activeSessionId}
        collapsedWorkspaceIds={collapsedWorkspaceIds}
        onSessionSelect={(sessionId) => {
          void selectSession(sessionId);
        }}
        onSessionArchive={(sessionId) => {
          void archiveSession(sessionId);
        }}
        onCreateSession={(workspaceId) => {
          void createSession(workspaceId);
        }}
        onAddProject={() => {
          void openWorkspace();
        }}
        onToggleWorkspaceCollapsed={toggleWorkspaceCollapsed}
        onToggleAllProjects={toggleAllProjects}
      />
    </div>
  );
};

export default ChatSidebarContent;
