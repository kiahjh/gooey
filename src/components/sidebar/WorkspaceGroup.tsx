import React from "react";
import {
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
} from "lucide-react";
import SessionRow from "./SessionRow";
import type { Workspace } from "./types";
import SidebarIconButton from "./SidebarIconButton";
import SidebarItemButton from "../ui/SidebarItemButton";

type WorkspaceGroupProps = {
  workspace: Workspace;
  isCollapsed: boolean;
  activeSessionId: string | null;
  onSessionSelect(sessionId: string): void;
  onSessionArchive(sessionId: string): void;
  onToggleCollapse(): void;
  onCreateSession(workspaceId: string): void;
};

const WorkspaceGroup: React.FC<WorkspaceGroupProps> = ({
  workspace,
  isCollapsed,
  activeSessionId,
  onSessionSelect,
  onSessionArchive,
  onToggleCollapse,
  onCreateSession,
}) => {
  const WorkspaceIcon = isCollapsed ? FolderIcon : FolderOpenIcon;

  return (
    <div
      className={`transition-[margin-bottom] duration-200 ease-out ${
        isCollapsed ? "mb-0" : "mb-2"
      }`}
    >
      <div className="group relative">
        <SidebarItemButton
          className="min-w-0 gap-2.5 py-1 pr-12 group-hover:bg-[#201d1a]"
          onClick={onToggleCollapse}
          aria-expanded={!isCollapsed}
        >
          <WorkspaceIcon
            aria-hidden="true"
            className="h-[15px] w-[15px] shrink-0 text-[#8f857c]"
            strokeWidth={1.9}
          />
          <span className="min-w-0 flex-1 truncate text-[13px] tracking-[-0.01em] text-[#8f857c]">
            {workspace.name}
          </span>
        </SidebarItemButton>
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1">
          <span className="pointer-events-auto">
            <SidebarIconButton
              ariaLabel={`Create conversation in ${workspace.name}`}
              icon={PlusIcon}
              tooltip="New conversation"
              onClick={() => onCreateSession(workspace.id)}
              className="h-5 w-5 shrink-0 rounded-md opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-[#2a2521]"
            />
          </span>
          <ChevronRightIcon
            aria-hidden="true"
            className={`h-3.5 w-3.5 text-[#6f6760] transition-transform duration-150 ${
              isCollapsed ? "" : "rotate-90"
            }`}
            strokeWidth={2}
          />
        </div>
      </div>
      <div
        className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin-top] duration-200 ease-out ${
          isCollapsed
            ? "mt-0 grid-rows-[0fr] opacity-0"
            : "mt-0.5 grid-rows-[1fr] opacity-100"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          {workspace.sessions.length === 0 ? (
            <div className="py-1.5 pl-[2.0625rem] pr-2 text-[13px] text-[#655c55]">
              No chats
            </div>
          ) : (
            <div className="space-y-0.5">
              {workspace.sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  onSelect={onSessionSelect}
                  onArchive={onSessionArchive}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceGroup;
