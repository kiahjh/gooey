import React from "react";
import { PenSquareIcon, Settings2Icon } from "lucide-react";
import ProjectsSection from "./sidebar/ProjectsSection";
import MainSidebarButton from "./ui/MainSidebarButton";
import { useGooeyStore } from "../state/useGooeyStore";

const Sidebar: React.FC = () => {
  const workspaces = useGooeyStore((state) => state.workspaces);
  const activeWorkspaceId = useGooeyStore((state) => state.activeWorkspaceId);
  const activeSessionId = useGooeyStore((state) => state.activeSessionId);
  const collapsedWorkspaceIds = useGooeyStore(
    (state) => state.collapsedWorkspaceIds,
  );
  const createSession = useGooeyStore((state) => state.createSession);
  const archiveSession = useGooeyStore((state) => state.archiveSession);
  const openWorkspace = useGooeyStore((state) => state.openWorkspace);
  const selectSession = useGooeyStore((state) => state.selectSession);
  const toggleWorkspaceCollapsed = useGooeyStore(
    (state) => state.toggleWorkspaceCollapsed,
  );
  const toggleAllProjects = useGooeyStore(
    (state) => state.toggleAllWorkspacesCollapsed,
  );
  const fallbackWorkspaceId = activeWorkspaceId ?? workspaces[0]?.id ?? null;

  return (
    <aside className="flex min-h-0 w-[268px] shrink-0 flex-col overflow-hidden px-2 pb-2">
      <div
        data-tauri-drag-region
        className="relative -mx-2 h-[47px] shrink-0 select-none"
      >
        <div className="absolute left-[15.5px] top-[15px] h-4 w-4 rounded-full border border-[#433d38] bg-[#1d1a18]" />
        <div className="absolute left-[38.5px] top-[15px] h-4 w-4 rounded-full border border-[#433d38] bg-[#1d1a18]" />
        <div className="absolute left-[61.5px] top-[15px] h-4 w-4 rounded-full border border-[#433d38] bg-[#1d1a18]" />
      </div>
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
          onClick={() => {}}
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
    </aside>
  );
};

export default Sidebar;
